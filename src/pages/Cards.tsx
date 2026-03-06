import { useState } from "react";
import Layout from "@/components/Layout";
import { useCreditCards, useCreditCardMutations, getUtilizationPct, getRiskLevel, type CreditCard } from "@/services/credit-cards";
import { cn } from "@/lib/utils";
import { CreditCard as CreditCardIcon, Plus, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Math.abs(n));
}

const riskColors = {
  low: 'text-success bg-success/10',
  medium: 'text-warning bg-warning/10',
  high: 'text-danger bg-danger/10',
  critical: 'text-danger bg-danger/20',
};

const riskLabels = { low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico' };

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

function CardEditor({ card, isNew, open, onOpenChange }: { card: CreditCard | null; isNew: boolean; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { add, update, remove } = useCreditCardMutations();
  const [form, setForm] = useState({
    bank: card?.bank || '', name: card?.name || '', lastFour: card?.lastFour || '',
    creditLimit: card?.creditLimit?.toString() || '', currentBalance: card?.currentBalance?.toString() || '0',
    closingDay: card?.closingDay?.toString() || '', dueDay: card?.dueDay?.toString() || '',
    minimumPayment: card?.minimumPayment?.toString() || '', noInterestPayment: card?.noInterestPayment?.toString() || '',
    apr: card?.apr?.toString() || '',
  });

  const handleSave = async () => {
    const data = {
      bank: form.bank, name: form.name, lastFour: form.lastFour || undefined,
      creditLimit: parseFloat(form.creditLimit) || 0, currentBalance: parseFloat(form.currentBalance) || 0,
      closingDay: parseInt(form.closingDay) || undefined, dueDay: parseInt(form.dueDay) || undefined,
      minimumPayment: parseFloat(form.minimumPayment) || undefined,
      noInterestPayment: parseFloat(form.noInterestPayment) || undefined,
      apr: parseFloat(form.apr) || undefined, active: true,
    };
    if (isNew) { await add.mutateAsync(data as any); }
    else if (card) { await update.mutateAsync({ id: card.id, ...data }); }
    onOpenChange(false);
  };

  const handleDelete = async () => { if (card) { await remove.mutateAsync(card.id); onOpenChange(false); } };

  const F = ({ label, field, type = 'text' }: { label: string; field: string; type?: string }) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className="mt-1" />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{isNew ? 'Nueva tarjeta' : 'Editar tarjeta'}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-6">
          <F label="Banco" field="bank" />
          <F label="Nombre" field="name" />
          <F label="Últimos 4 dígitos" field="lastFour" />
          <F label="Límite de crédito" field="creditLimit" type="number" />
          <F label="Saldo actual" field="currentBalance" type="number" />
          <div className="grid grid-cols-2 gap-3">
            <F label="Día de corte" field="closingDay" type="number" />
            <F label="Día de pago" field="dueDay" type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Pago mínimo" field="minimumPayment" type="number" />
            <F label="Pago sin intereses" field="noInterestPayment" type="number" />
          </div>
          <F label="Tasa anual (%)" field="apr" type="number" />
          <Button onClick={handleSave} className="w-full" disabled={!form.bank || !form.name}>
            {isNew ? 'Agregar tarjeta' : 'Guardar cambios'}
          </Button>
          {!isNew && (
            <Button variant="outline" onClick={handleDelete} className="w-full text-destructive hover:text-destructive">
              Eliminar tarjeta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Cards() {
  const { data: cards = [], isLoading } = useCreditCards();
  const [editCard, setEditCard] = useState<CreditCard | null>(null);
  const [isNew, setIsNew] = useState(false);

  const activeCards = cards.filter(c => c.active);
  const totalDebt = activeCards.reduce((s, c) => s + Math.abs(c.currentBalance), 0);
  const totalLimit = activeCards.reduce((s, c) => s + c.creditLimit, 0);
  const totalAvailable = totalLimit - totalDebt;
  const globalUtil = totalLimit > 0 ? Math.round((totalDebt / totalLimit) * 100) : 0;

  const sorted = [...activeCards].sort((a, b) => getUtilizationPct(b) - getUtilizationPct(a));

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tarjetas</h2>
            <p className="text-muted-foreground text-sm mt-1">Control y semáforo de riesgo</p>
          </div>
          <button onClick={() => { setEditCard(null); setIsNew(true); }} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </motion.div>

        {/* Summary */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
          <div className="card-calm p-4">
            <p className="text-label">Deuda total</p>
            <p className="text-xl font-bold text-danger mt-1">{formatMoney(totalDebt)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-label">Disponible</p>
            <p className="text-xl font-bold text-primary mt-1">{formatMoney(totalAvailable)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-label">Utilización</p>
            <p className={cn("text-xl font-bold mt-1", globalUtil >= 60 ? "text-danger" : globalUtil >= 40 ? "text-warning" : "text-success")}>{globalUtil}%</p>
          </div>
        </motion.div>

        {/* Global utilization bar */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="card-calm p-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Utilización global</span>
            <span>{formatMoney(totalDebt)} / {formatMoney(totalLimit)}</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", globalUtil >= 60 ? "bg-danger" : globalUtil >= 40 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(globalUtil, 100)}%` }} />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="card-calm h-32 animate-pulse" />)}</div>
        ) : sorted.length === 0 ? (
          <div className="card-calm p-8 text-center">
            <CreditCardIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No tienes tarjetas registradas</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setEditCard(null); setIsNew(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Agregar tarjeta
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((card, i) => {
              const util = getUtilizationPct(card);
              const risk = getRiskLevel(card);
              return (
                <motion.div key={card.id} {...fadeIn} transition={{ delay: 0.15 + i * 0.05 }}>
                  <button onClick={() => { setEditCard(card); setIsNew(false); }} className="card-calm w-full p-5 text-left hover:bg-accent/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                          <CreditCardIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{card.name}</p>
                          <p className="text-xs text-muted-foreground">{card.bank}{card.lastFour ? ` •••• ${card.lastFour}` : ''}</p>
                        </div>
                      </div>
                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full", riskColors[risk])}>
                        {risk === 'critical' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {risk === 'low' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {riskLabels[risk]}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Saldo</p>
                        <p className="font-semibold text-danger">{formatMoney(card.currentBalance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Disponible</p>
                        <p className="font-semibold text-foreground">{formatMoney(card.creditLimit - Math.abs(card.currentBalance))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Límite</p>
                        <p className="font-semibold text-muted-foreground">{formatMoney(card.creditLimit)}</p>
                      </div>
                    </div>

                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                      <div className={cn("h-full rounded-full transition-all", util >= 60 ? "bg-danger" : util >= 40 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(util, 100)}%` }} />
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {card.closingDay && <span>Corte: día {card.closingDay}</span>}
                      {card.dueDay && <span>Pago: día {card.dueDay}</span>}
                      {card.minimumPayment && <span>Mínimo: {formatMoney(card.minimumPayment)}</span>}
                      {card.noInterestPayment && <span>Sin intereses: {formatMoney(card.noInterestPayment)}</span>}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <CardEditor card={editCard} isNew={isNew} open={!!editCard || isNew} onOpenChange={(o) => { if (!o) { setEditCard(null); setIsNew(false); } }} />
    </Layout>
  );
}
