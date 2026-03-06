import { useState } from "react";
import Layout from "@/components/Layout";
import { useReceivables, useReceivableMutations, type Receivable } from "@/services/receivables";
import { cn } from "@/lib/utils";
import { UserCheck, Plus, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', color: 'text-warning bg-warning/10', icon: Clock },
  partial: { label: 'Parcial', color: 'text-primary bg-primary/10', icon: Clock },
  paid: { label: 'Pagado', color: 'text-success bg-success/10', icon: CheckCircle },
  overdue: { label: 'Vencido', color: 'text-danger bg-danger/10', icon: AlertCircle },
  cancelled: { label: 'Cancelado', color: 'text-muted-foreground bg-secondary', icon: Clock },
};

function ReceivableEditor({ item, isNew, open, onOpenChange }: { item: Receivable | null; isNew: boolean; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { add, update, remove } = useReceivableMutations();
  const [form, setForm] = useState({
    debtorName: item?.debtorName || '', concept: item?.concept || '',
    amountTotal: item?.amountTotal?.toString() || '', amountPaid: item?.amountPaid?.toString() || '0',
    dueDate: item?.dueDate || '', status: (item?.status || 'pending') as Receivable['status'],
    reminderEnabled: item?.reminderEnabled || false, notes: item?.notes || '',
  });

  const handleSave = async () => {
    const data = {
      debtorName: form.debtorName, concept: form.concept || undefined,
      amountTotal: parseFloat(form.amountTotal) || 0, amountPaid: parseFloat(form.amountPaid) || 0,
      dueDate: form.dueDate || undefined, status: form.status as Receivable['status'],
      reminderEnabled: form.reminderEnabled, notes: form.notes || undefined,
    };
    if (isNew) await add.mutateAsync(data as any);
    else if (item) await update.mutateAsync({ id: item.id, ...data });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{isNew ? 'Nueva cuenta por cobrar' : 'Editar'}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-6">
          <div><Label className="text-xs text-muted-foreground">¿Quién te debe?</Label><Input value={form.debtorName} onChange={e => setForm(p => ({ ...p, debtorName: e.target.value }))} className="mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">Concepto</Label><Input value={form.concept} onChange={e => setForm(p => ({ ...p, concept: e.target.value }))} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Monto total</Label><Input type="number" value={form.amountTotal} onChange={e => setForm(p => ({ ...p, amountTotal: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs text-muted-foreground">Pagado</Label><Input type="number" value={form.amountPaid} onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs text-muted-foreground">Fecha límite</Label><Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="mt-1" /></div>
          <div>
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as Receivable['status'] }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Recordatorio por Telegram</Label>
            <Switch checked={form.reminderEnabled} onCheckedChange={v => setForm(p => ({ ...p, reminderEnabled: v }))} />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!form.debtorName}>{isNew ? 'Agregar' : 'Guardar'}</Button>
          {!isNew && <Button variant="outline" onClick={() => { if (item) { remove.mutateAsync(item.id); onOpenChange(false); } }} className="w-full text-destructive">Eliminar</Button>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Receivables() {
  const { data: receivables = [], isLoading } = useReceivables();
  const [editItem, setEditItem] = useState<Receivable | null>(null);
  const [isNew, setIsNew] = useState(false);

  const pending = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled');
  const totalPending = pending.reduce((s, r) => s + (r.amountTotal - r.amountPaid), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Por cobrar</h2>
            <p className="text-muted-foreground text-sm mt-1">Seguimiento de lo que te deben</p>
          </div>
          <button onClick={() => { setEditItem(null); setIsNew(true); }} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
          <div className="card-calm p-4">
            <p className="text-label">Por cobrar</p>
            <p className="text-xl font-bold text-primary mt-1">{formatMoney(totalPending)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-label">Pendientes</p>
            <p className="text-xl font-bold text-foreground mt-1">{pending.length}</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="card-calm h-20 animate-pulse" />)}</div>
        ) : receivables.length === 0 ? (
          <div className="card-calm p-8 text-center">
            <UserCheck className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nadie te debe 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivables.map((r, i) => {
              const remaining = r.amountTotal - r.amountPaid;
              const paidPct = r.amountTotal > 0 ? Math.round((r.amountPaid / r.amountTotal) * 100) : 0;
              const sc = statusConfig[r.status] || statusConfig.pending;
              const Icon = sc.icon;
              return (
                <motion.div key={r.id} {...fadeIn} transition={{ delay: 0.1 + i * 0.05 }}>
                  <button onClick={() => { setEditItem(r); setIsNew(false); }} className="card-calm w-full p-4 text-left hover:bg-accent/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{r.debtorName}</p>
                        <p className="text-xs text-muted-foreground">{r.concept || 'Sin concepto'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{formatMoney(remaining)}</p>
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1", sc.color)}>
                          <Icon className="w-3 h-3" /> {sc.label}
                        </span>
                      </div>
                    </div>
                    {paidPct > 0 && paidPct < 100 && (
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${paidPct}%` }} />
                      </div>
                    )}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {r.dueDate && <span>Vence: {new Date(r.dueDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>}
                      {r.reminderEnabled && <span>🔔 Recordatorio activo</span>}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <ReceivableEditor item={editItem} isNew={isNew} open={!!editItem || isNew} onOpenChange={(o) => { if (!o) { setEditItem(null); setIsNew(false); } }} />
    </Layout>
  );
}
