import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAppData } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedTransaction {
  date: string;
  amount: number;
  type: "expense" | "income";
  merchant: string;
  category: string;
  categoryIcon: string;
  selected: boolean;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
}

type Step = "upload" | "processing" | "preview" | "importing";

export default function StatementImporter({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { accounts, addTransaction, categories, addCategory } = useAppData();
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

  const handleProcess = async () => {
    if (!file || !selectedAccount || !user) return;
    setStep("processing");
    setProgress(20);

    try {
      // Upload file to storage
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("statements")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error("Error subiendo archivo: " + uploadError.message);
      }
      setProgress(40);

      // Call edge function
      const { data, error } = await supabase.functions.invoke("parse-statement", {
        body: { filePath },
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

      setParsed(data.transactions.map((t: any) => ({ ...t, selected: true })));
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
    const allSelected = parsed.every((t) => t.selected);
    setParsed((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const selectedTxs = parsed.filter((t) => t.selected);
  const totalIncome = selectedTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = selectedTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const handleConfirm = async () => {
    if (!user || selectedTxs.length === 0) return;
    setStep("importing");

    try {
      // Find new categories that need to be created
      const existingCatNames = new Set(categories.map((c) => c.name));
      const newCats = new Map<string, string>();
      for (const tx of selectedTxs) {
        if (!existingCatNames.has(tx.category) && !newCats.has(tx.category)) {
          newCats.set(tx.category, tx.categoryIcon);
        }
      }

      // Create new categories
      for (const [name, icon] of newCats) {
        await addCategory({ name, icon });
      }

      // Insert all transactions
      for (const tx of selectedTxs) {
        await addTransaction({
          type: tx.type,
          amount: tx.amount,
          currency: "MXN",
          date: tx.date,
          category: tx.category,
          categoryIcon: tx.categoryIcon,
          account: selectedAccount,
          merchant: tx.merchant,
        });
      }

      toast.success(`${selectedTxs.length} movimientos importados correctamente`);
      handleClose(false);
    } catch (err: any) {
      console.error("Import confirm error:", err);
      toast.error("Error importando movimientos");
      setStep("preview");
    }
  };

  const acceptedTypes = ".pdf,.png,.jpg,.jpeg,.webp";

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
            <div className="grid grid-cols-3 gap-3">
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
            </div>

            {/* Transaction list */}
            <div className="max-h-[400px] overflow-y-auto border rounded-lg divide-y divide-border">
              {/* Header */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 sticky top-0">
                <Checkbox checked={parsed.every((t) => t.selected)} onCheckedChange={toggleAll} />
                <span className="text-xs font-medium text-muted-foreground flex-1">Movimiento</span>
                <span className="text-xs font-medium text-muted-foreground w-24 text-right">Monto</span>
              </div>
              {parsed.map((tx, idx) => (
                <div key={idx} className={cn("flex items-center gap-3 p-3 transition-colors", !tx.selected && "opacity-40")}>
                  <Checkbox checked={tx.selected} onCheckedChange={() => toggleTransaction(idx)} />
                  <span className="text-lg">{tx.categoryIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.merchant}</p>
                    <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
                  </div>
                  <p className={cn("text-sm font-semibold w-24 text-right", tx.type === "income" ? "text-success" : "text-foreground")}>
                    {tx.type === "expense" ? "–" : "+"} {formatMoney(tx.amount)}
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
