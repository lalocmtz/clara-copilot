import { useState } from "react";
import Layout from "@/components/Layout";
import { useDebts, useDebtMutations, useUnifiedObligations, snowballOrder, avalancheOrder, calculatePayoff, type Debt, type DebtObligation } from "@/services/debts";
import { useFinancialPosition } from "@/services/financial-position";
import { cn } from "@/lib/utils";
import { Landmark, Plus, TrendingDown, Zap, ArrowDownRight, CreditCard, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Math.abs(n));
}

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const debtTypeLabels: Record<string, string> = {
  personal_loan: 'Préstamo personal', family: 'Familiar',
  supplier: 'Proveedor', mortgage: 'Hipoteca', auto: 'Auto', other: 'Otro',
};

function DebtEditor({ debt, isNew, open, onOpenChange }: { debt: Debt | null; isNew: boolean; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { add, update, remove } = useDebtMutations();
  const [form, setForm] = useState({
    name: debt?.name || '', creditor: debt?.creditor || '',
    originalAmount: debt?.originalAmount?.toString() || '', currentBalance: debt?.currentBalance?.toString() || '',
    apr: debt?.apr?.toString() || '0', minimumPayment: debt?.minimumPayment?.toString() || '',
    dueDay: debt?.dueDay?.toString() || '', type: debt?.type || 'other',
    strategyTag: (debt?.strategyTag || 'manual') as 'avalanche' | 'snowball' | 'manual', notes: debt?.notes || '',
  });

  const handleSave = async () => {
    const data = {
      name: form.name, creditor: form.creditor || undefined,
      originalAmount: parseFloat(form.originalAmount) || 0, currentBalance: parseFloat(form.currentBalance) || 0,
      apr: parseFloat(form.apr) || 0, minimumPayment: parseFloat(form.minimumPayment) || 0,
      dueDay: parseInt(form.dueDay) || undefined, type: form.type,
      strategyTag: form.strategyTag as Debt['strategyTag'], notes: form.notes || undefined, active: true,
    };
    if (isNew) await add.mutateAsync(data as any);
    else if (debt) await update.mutateAsync({ id: debt.id, ...data });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{isNew ? 'Nueva deuda' : 'Editar deuda'}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-6">
          <div><Label className="text-xs text-muted-foreground">Nombre</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">Acreedor</Label><Input value={form.creditor} onChange={e => setForm(p => ({ ...p, creditor: e.target.value }))} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Monto original</Label><Input type="number" value={form.originalAmount} onChange={e => setForm(p => ({ ...p, originalAmount: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Saldo actual</Label><Input type="number" value={form.currentBalance} onChange={e => setForm(p => ({ ...p, currentBalance: e.target.value }))} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs text-muted-foreground">Tasa (%)</Label><Input type="number" value={form.apr} onChange={e => setForm(p => ({ ...p, apr: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Pago mínimo</Label><Input type="number" value={form.minimumPayment} onChange={e => setForm(p => ({ ...p, minimumPayment: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Día pago</Label><Input type="number" value={form.dueDay} onChange={e => setForm(p => ({ ...p, dueDay: e.target.value }))} className="mt-1" /></div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(debtTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!form.name}>{isNew ? 'Agregar deuda' : 'Guardar'}</Button>
          {!isNew && <Button variant="outline" onClick={() => { if (debt) { remove.mutateAsync(debt.id); onOpenChange(false); } }} className="w-full text-destructive">Eliminar</Button>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Debts() {
  const { data: obligations = [], isLoading } = useUnifiedObligations();
  const pos = useFinancialPosition();
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  const totalMinimum = obligations.reduce((s, d) => s + d.minimumPayment, 0);
  const avgApr = obligations.length > 0 ? obligations.reduce((s, d) => s + d.apr, 0) / obligations.length : 0;

  const ordered = strategy === 'avalanche' ? avalancheOrder(obligations) : snowballOrder(obligations);

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Deudas</h2>
            <p className="text-muted-foreground text-sm mt-1">Vista estratégica unificada</p>
          </div>
          <button onClick={() => { setEditDebt(null); setIsNew(true); }} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80">
            <Plus className="w-4 h-4" /> Agregar deuda
          </button>
        </motion.div>

        {/* Section 1: Debt summary */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="card-calm p-4">
              <p className="text-label">Deuda tarjetas</p>
              <p className="text-xl font-bold text-danger mt-1">{formatMoney(pos.totalCardDebt)}</p>
            </div>
            <div className="card-calm p-4">
              <p className="text-label">Deuda no tarjeta</p>
              <p className="text-xl font-bold text-danger mt-1">{formatMoney(pos.totalNonCardDebt)}</p>
            </div>
            <div className="card-calm p-4">
              <p className="text-label">Deuda total</p>
              <p className="text-xl font-bold text-foreground mt-1">{formatMoney(pos.totalDebt)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="card-calm p-4">
              <p className="text-label">Pago mínimo/mes</p>
              <p className="text-lg font-semibold text-foreground mt-1">{formatMoney(totalMinimum)}</p>
            </div>
            <div className="card-calm p-4">
              <p className="text-label">Tasa promedio</p>
              <p className="text-lg font-semibold text-warning mt-1">{avgApr.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Strategy selector */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="flex gap-2">
          <button onClick={() => setStrategy('avalanche')}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              strategy === 'avalanche' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
            <Zap className="w-4 h-4" /> Avalancha
          </button>
          <button onClick={() => setStrategy('snowball')}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              strategy === 'snowball' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
            <ArrowDownRight className="w-4 h-4" /> Bola de nieve
          </button>
        </motion.div>

        <p className="text-xs text-muted-foreground -mt-3">
          {strategy === 'avalanche' ? 'Prioriza la obligación con mayor tasa de interés → ahorras más en intereses.' : 'Prioriza la obligación más pequeña → ganas momentum pagando rápido.'}
        </p>

        {/* Section 3: Unified priority list */}
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="card-calm h-24 animate-pulse" />)}</div>
        ) : ordered.length === 0 ? (
          <div className="card-calm p-8 text-center">
            <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No tienes deudas activas 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ordered.map((ob, i) => {
              const payoff = calculatePayoff(ob.currentBalance, ob.apr, ob.minimumPayment);
              const sourceLabel = ob.source === 'credit_card' ? 'Tarjeta' : 'Préstamo';
              const SourceIcon = ob.source === 'credit_card' ? CreditCard : Landmark;
              return (
                <motion.div key={ob.obligationId} {...fadeIn} transition={{ delay: 0.15 + i * 0.05 }}>
                  <div className={cn("card-calm w-full p-5 text-left", i === 0 && "ring-2 ring-primary/30")}>
                    {i === 0 && <p className="text-xs font-medium text-primary mb-2">⚡ Prioridad #1</p>}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SourceIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{ob.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium",
                              ob.source === 'credit_card' ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                            )}>{sourceLabel}</span>
                            {ob.creditor && <span className="text-xs text-muted-foreground">{ob.creditor}</span>}
                          </div>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-danger">{formatMoney(ob.currentBalance)}</p>
                    </div>

                    {ob.utilization != null && (
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                        <div className={cn("h-full rounded-full transition-all",
                          ob.utilization >= 60 ? "bg-danger" : ob.utilization >= 40 ? "bg-warning" : "bg-primary"
                        )} style={{ width: `${Math.min(ob.utilization, 100)}%` }} />
                      </div>
                    )}

                    <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>Tasa: {ob.apr}%</span>
                      <span>Mínimo: {formatMoney(ob.minimumPayment)}</span>
                      {ob.noInterestPayment && <span>Sin intereses: {formatMoney(ob.noInterestPayment)}</span>}
                      {ob.dueDay && <span>Día pago: {ob.dueDay}</span>}
                      {payoff.months < Infinity && payoff.months > 0 && <span>~{payoff.months} meses</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-2">
          Las tarjetas se gestionan desde <span className="font-medium text-primary">Tarjetas</span>. Aquí solo se agregan deudas no tarjeta.
        </p>
      </div>
      <DebtEditor debt={editDebt} isNew={isNew} open={!!editDebt || isNew} onOpenChange={(o) => { if (!o) { setEditDebt(null); setIsNew(false); } }} />
    </Layout>
  );
}
