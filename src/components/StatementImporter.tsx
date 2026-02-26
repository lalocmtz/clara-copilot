import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Check, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedTransaction {
  date: string;
  amount: number;
  type: "expense" | "income" | "transfer";
  merchant: string;
  category: string;
  categoryIcon: string;
  isSubscription?: boolean;
  subscriptionName?: string;
  selected: boolean;
  addedAsSub?: boolean;
  reconcileStatus?: 'duplicate' | 'discrepancy' | 'new';
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
}

function normalizeStr(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isSimilarMerchant(a: string, b: string): boolean {
  const na = normalizeStr(a);
  const nb = normalizeStr(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

function dateDiffDays(d1: string, d2: string): number {
  return Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60 * 24);
}

type Step = "upload" | "processing" | "preview" | "importing";

export default function StatementImporter({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { accounts, addTransaction, categories, addCategory, addSubscription, transactions: existingTransactions } = useAppData();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setSelectedAccount("");
    setFile(null);
    setParsed([]);
    setProgress(0);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const reconcileTransactions = (parsedTxs: any[]): ParsedTransaction[] => {
    // Get existing transactions for the same account
    const accountTxs = existingTransactions.filter(t => t.account === selectedAccount);

    return parsedTxs.map((t: any) => {
      const base: ParsedTransaction = {
        ...t,
        selected: t.type !== "transfer",
        addedAsSub: false,
      };

      // Find matching existing transaction
      const match = accountTxs.find(existing => {
        const dateClose = dateDiffDays(existing.date, t.date) <= 1;
        const sameAmount = existing.amount === t.amount;
        const similarAmount = Math.abs(existing.amount - t.amount) / Math.max(existing.amount, t.amount) < 0.05;
        const merchantMatch = isSimilarMerchant(existing.merchant || existing.category, t.merchant || '');

        if (dateClose && sameAmount && merchantMatch) return true;
        if (dateClose && similarAmount && merchantMatch) return true;
        return false;
      });

      if (match) {
        const exactAmount = match.amount === t.amount;
        if (exactAmount) {
          // Duplicate - deselect
          return { ...base, selected: false, reconcileStatus: 'duplicate' as const };
        } else {
          // Discrepancy
          return { ...base, selected: true, reconcileStatus: 'discrepancy' as const };
        }
      }

      // New transaction - mark as new
      return { ...base, selected: true, reconcileStatus: 'new' as const };
    });
  };

  const handleProcess = async () => {
    if (!file || !selectedAccount || !user) return;
    setStep("processing");
    setProgress(20);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("statements")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error("Error subiendo archivo: " + uploadError.message);
      }
      setProgress(40);

      const accountNames = accounts.map(a => a.name);
      const { data, error } = await supabase.functions.invoke("parse-statement", {
        body: { filePath, accountNames },
      });

      setProgress(80);

      if (error) {
        throw new Error(error.message || "Error procesando el archivo");
      }

      if (!data?.transactions || data.transactions.length === 0) {
        toast.error("No se encontraron movimientos en el archivo");
        setStep("upload");
        return;
      }

      const reconciled = reconcileTransactions(data.transactions);
      setParsed(reconciled);
      setProgress(100);
      setStep("preview");
    } catch (err: any) {
      console.error("Statement import error:", err);
      toast.error(err.message || "Error procesando el estado de cuenta");
      setStep("upload");
    }
  };

  const toggleTransaction = (idx: number) => {
    setParsed((prev) => prev.map((t, i) => (i === idx ? { ...t, selected: !t.selected } : t)));
  };

  const toggleAll = () => {
    const allSelected = parsed.filter(t => t.reconcileStatus !== 'duplicate').every((t) => t.selected);
    setParsed((prev) => prev.map((t) => t.reconcileStatus === 'duplicate' ? t : { ...t, selected: !allSelected }));
  };

  const handleAddSubscription = async (tx: ParsedTransaction, idx: number) => {
    const name = tx.subscriptionName || tx.merchant;
    const day = new Date(tx.date).getDate();
    await addSubscription({
      name,
      amount: tx.amount,
      frequency: "monthly",
      nextDate: tx.date,
      paid: false,
      billingDay: day,
      subType: "digital",
      category: tx.category,
      categoryIcon: tx.categoryIcon,
    });
    setParsed(prev => prev.map((t, i) => i === idx ? { ...t, addedAsSub: true } : t));
    toast.success(`"${name}" agregado a suscripciones`);
  };

  const selectedTxs = parsed.filter((t) => t.selected);
  const totalIncome = selectedTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = selectedTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalTransfer = selectedTxs.filter((t) => t.type === "transfer").reduce((s, t) => s + t.amount, 0);

  const handleConfirm = async () => {
    if (!user || selectedTxs.length === 0) return;
    setStep("importing");

    try {
      const existingCatNames = new Set(categories.map((c) => c.name));
      const newCats = new Map<string, string>();
      for (const tx of selectedTxs) {
        if (!existingCatNames.has(tx.category) && !newCats.has(tx.category)) {
          newCats.set(tx.category, tx.categoryIcon);
        }
      }

      for (const [name, icon] of newCats) {
        await addCategory({ name, icon, type: 'expense' });
      }

      // All imported transactions skip balance update and new ones are pending
      for (const tx of selectedTxs) {
        const status = tx.reconcileStatus === 'new' ? 'pending' : 'confirmed';
        await addTransaction({
          type: tx.type,
          amount: tx.amount,
          currency: "MXN",
          date: tx.date,
          category: tx.type === "transfer" ? "Transferencia" : tx.category,
          categoryIcon: tx.type === "transfer" ? "↔" : tx.categoryIcon,
          account: selectedAccount,
          merchant: tx.merchant,
          status,
        }, { skipBalanceUpdate: true });
      }

      // Save import history record
      const dates = selectedTxs.map(t => t.date).sort();
      const { error: historyError } = await supabase.from("statement_imports").insert({
        user_id: user.id,
        file_name: file?.name || "archivo",
        account_name: selectedAccount,
        transactions_count: selectedTxs.length,
        period_start: dates[0],
        period_end: dates[dates.length - 1],
      });
      if (historyError) {
        console.error("Error saving import history:", historyError);
      }

      toast.success(`${selectedTxs.length} movimientos importados (sin afectar saldos)`);
      handleClose(false);
    } catch (err: any) {
      console.error("Import confirm error:", err);
      toast.error("Error importando movimientos");
      setStep("preview");
    }
  };

  const typeBadge = (type: string) => {
    if (type === "transfer") return <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">Transferencia</Badge>;
    if (type === "income") return <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">Ingreso</Badge>;
    return null;
  };

  const reconcileBadge = (status?: string) => {
    if (status === 'duplicate') return <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">Ya registrado</Badge>;
    if (status === 'discrepancy') return <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">Discrepancia</Badge>;
    if (status === 'new') return <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Nuevo</Badge>;
    return null;
  };

  const acceptedTypes = ".pdf,.png,.jpg,.jpeg,.webp";

  const duplicateCount = parsed.filter(t => t.reconcileStatus === 'duplicate').length;
  const newCount = parsed.filter(t => t.reconcileStatus === 'new').length;
  const discrepancyCount = parsed.filter(t => t.reconcileStatus === 'discrepancy').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("max-w-2xl", step === "preview" && "max-w-4xl")}>
        <DialogHeader>
          <DialogTitle>Importar estado de cuenta</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Sube un PDF o imagen de tu estado de cuenta para extraer los movimientos automáticamente."}
            {step === "processing" && "Analizando tu estado de cuenta con IA..."}
            {step === "preview" && `${parsed.length} movimientos detectados. Revisa y confirma.`}
            {step === "importing" && "Importando movimientos..."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Cuenta destino</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.name}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
            >
              <input ref={fileInputRef} type="file" accept={acceptedTypes} onChange={handleFileChange} className="hidden" />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium">Arrastra o selecciona un archivo</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, WEBP</p>
                </div>
              )}
            </div>

            <Button onClick={handleProcess} disabled={!file || !selectedAccount} className="w-full">
              Analizar estado de cuenta
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {progress < 40 ? "Subiendo archivo..." : progress < 80 ? "La IA está leyendo tu estado de cuenta..." : "Casi listo..."}
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="card-calm p-3 text-center">
                <p className="text-xs text-muted-foreground">Seleccionados</p>
                <p className="text-lg font-semibold text-foreground">{selectedTxs.length}</p>
              </div>
              <div className="card-calm p-3 text-center">
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="text-lg font-semibold text-success">{formatMoney(totalIncome)}</p>
              </div>
              <div className="card-calm p-3 text-center">
                <p className="text-xs text-muted-foreground">Gastos</p>
                <p className="text-lg font-semibold text-foreground">{formatMoney(totalExpense)}</p>
              </div>
              <div className="card-calm p-3 text-center">
                <p className="text-xs text-muted-foreground">Transferencias</p>
                <p className="text-lg font-semibold text-warning">{formatMoney(totalTransfer)}</p>
              </div>
            </div>

            {/* Reconciliation info */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
              <p>📋 <strong>Reconciliación:</strong> {duplicateCount} ya registrados · {discrepancyCount} con discrepancia · {newCount} nuevos</p>
              <p>💡 Los movimientos importados <strong>no modifican los saldos</strong> de tus cuentas. Los nuevos quedan como "Pendiente" para tu revisión.</p>
            </div>

            {/* Transaction list */}
            <div className="max-h-[400px] overflow-y-auto border rounded-lg divide-y divide-border">
              <div className="flex items-center gap-3 p-3 bg-muted/50 sticky top-0">
                <Checkbox checked={parsed.filter(t => t.reconcileStatus !== 'duplicate').every((t) => t.selected)} onCheckedChange={toggleAll} />
                <span className="text-xs font-medium text-muted-foreground flex-1">Movimiento</span>
                <span className="text-xs font-medium text-muted-foreground w-24 text-right">Monto</span>
              </div>
              {parsed.map((tx, idx) => (
                <div key={idx} className={cn(
                  "flex items-center gap-3 p-3 transition-colors",
                  !tx.selected && "opacity-40",
                  tx.reconcileStatus === 'duplicate' && "bg-muted/30",
                )}>
                  <Checkbox checked={tx.selected} onCheckedChange={() => toggleTransaction(idx)} />
                  <span className="text-lg">{tx.categoryIcon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{tx.merchant}</p>
                      {typeBadge(tx.type)}
                      {reconcileBadge(tx.reconcileStatus)}
                      {tx.isSubscription && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Suscripción</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
                  </div>
                  {tx.isSubscription && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      disabled={tx.addedAsSub}
                      onClick={(e) => { e.stopPropagation(); handleAddSubscription(tx, idx); }}
                      title="Agregar a suscripciones"
                    >
                      <CalendarPlus className={cn("w-4 h-4", tx.addedAsSub ? "text-success" : "text-primary")} />
                    </Button>
                  )}
                  <p className={cn(
                    "text-sm font-semibold w-24 text-right shrink-0",
                    tx.type === "income" ? "text-success" : tx.type === "transfer" ? "text-warning" : "text-foreground"
                  )}>
                    {tx.type === "expense" ? "–" : tx.type === "transfer" ? "↔" : "+"} {formatMoney(tx.amount)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Volver
              </Button>
              <Button onClick={handleConfirm} disabled={selectedTxs.length === 0} className="flex-1">
                <Check className="w-4 h-4 mr-1" />
                Importar {selectedTxs.length} movimientos
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground">Importando movimientos...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
