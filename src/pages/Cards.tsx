import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useCreditCards, useCreditCardMutations, getUtilizationPct, getRiskLevel, getCardRiskMetrics, type CreditCard } from "@/services/credit-cards";
import { calculatePayoff } from "@/services/debts";
import { cn } from "@/lib/utils";
import { CreditCard as CreditCardIcon, Plus, AlertTriangle, CheckCircle, RefreshCw, List, Zap, ArrowDownRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    apr: card?.apr?.toString() || '', notes: card?.notes || '',
  });

  const handleSave = async () => {
    const data = {
      bank: form.bank, name: form.name, lastFour: form.lastFour || undefined,
      creditLimit: parseFloat(form.creditLimit) || 0, currentBalance: parseFloat(form.currentBalance) || 0,
      closingDay: parseInt(form.closingDay) || undefined, dueDay: parseInt(form.dueDay) || undefined,
      minimumPayment: parseFloat(form.minimumPayment) || undefined,
      noInterestPayment: parseFloat(form.noInterestPayment) || undefined,
      apr: parseFloat(form.apr) || undefined, notes: form.notes || undefined, active: true,
    };
    if (isNew) { await add.mutateAsync(data as any); }
    else if (card) { await update.mutateAsync({ id: card.id, ...data }); }
    onOpenChange(false);
  };

  const handleDelete = async () => { if (card) { await remove.mutateAsync(card.id); onOpenChange(false); } };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div key={key}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="mt-1" />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{isNew ? 'Nueva tarjeta' : 'Estado actual de la tarjeta'}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-6">
          {field("Banco", "bank")}
          {field("Nombre", "name")}
          {field("Últimos 4 dígitos", "lastFour")}
          {field("Límite de crédito", "creditLimit", "number")}
          {field("Saldo actual (deuda)", "currentBalance", "number")}
          <div className="grid grid-cols-2 gap-3">
            {field("Día de corte", "closingDay", "number")}
            {field("Día de pago", "dueDay", "number")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Pago mínimo", "minimumPayment", "number")}
            {field("Pago sin intereses", "noInterestPayment", "number")}
          </div>
          {field("Tasa anual (%)", "apr", "number")}
          <div>
            <Label className="text-xs text-muted-foreground">Notas</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" placeholder="Notas sobre esta tarjeta..." />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!form.bank || !form.name}>
            {isNew ? 'Agregar tarjeta' : 'Guardar estado'}
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
  const navigate = useNavigate();
  const { data: cards = [], isLoading } = useCreditCards();
  const [editCard, setEditCard] = useState<CreditCard | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('snowball');

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
            <p className="text-muted-foreground text-sm mt-1">Centro operativo y semáforo de riesgo</p>
          </div>
          <button onClick={() => { setEditCard(null); setIsNew(true); }} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </motion.div>

        {/* Summary */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3">
          <div className="card-calm p-4">
            <p className="text-label">Deuda tarjetas</p>
            <p className="text-xl font-bold text-danger mt-1">{formatMoney(totalDebt)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-label">Crédito disponible</p>
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
              const metrics = getCardRiskMetrics(card);
              const risk = metrics.riskLevel;
              return (
                <motion.div key={card.id} {...fadeIn} transition={{ delay: 0.15 + i * 0.05 }}>
                  <div className="card-calm w-full p-5 text-left">
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
                        <p className="font-semibold text-foreground">{formatMoney(metrics.availableCredit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Límite</p>
                        <p className="font-semibold text-muted-foreground">{formatMoney(card.creditLimit)}</p>
                      </div>
                    </div>

                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                      <div className={cn("h-full rounded-full transition-all", metrics.utilization >= 60 ? "bg-danger" : metrics.utilization >= 40 ? "bg-warning" : "bg-primary")} style={{ width: `${Math.min(metrics.utilization, 100)}%` }} />
                    </div>

                    {/* Payment info block */}
                    <div className="flex gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                      {card.closingDay && <span>Corte: día {card.closingDay}{metrics.daysToClosing != null && ` (${metrics.daysToClosing}d)`}</span>}
                      {card.dueDay && <span>Pago: día {card.dueDay}{metrics.daysToDue != null && ` (${metrics.daysToDue}d)`}</span>}
                      {card.minimumPayment != null && <span>Mínimo: {formatMoney(card.minimumPayment)}</span>}
                      {card.noInterestPayment != null && <span>Sin intereses: {formatMoney(card.noInterestPayment)}</span>}
                      {card.apr != null && <span>Tasa: {card.apr}%</span>}
                    </div>

                    {/* CTAs */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button onClick={() => { setEditCard(card); setIsNew(false); }}
                        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-80 px-3 py-1.5 rounded-lg bg-primary/5 transition-colors">
                        <RefreshCw className="w-3 h-3" /> Actualizar estado
                      </button>
                      <button onClick={() => navigate('/transactions')}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary transition-colors">
                        <List className="w-3 h-3" /> Ver movimientos
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        {/* Payoff Strategy */}
        {activeCards.filter(c => Math.abs(c.currentBalance) > 0).length > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Estrategia de pago</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Ordena tus tarjetas para liquidarlas más rápido</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStrategy('snowball')}
                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  strategy === 'snowball' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                <ArrowDownRight className="w-4 h-4" /> Bola de nieve
              </button>
              <button onClick={() => setStrategy('avalanche')}
                className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  strategy === 'avalanche' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                <Zap className="w-4 h-4" /> Avalancha
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {strategy === 'snowball'
                ? 'Paga primero la tarjeta con menor saldo → ganas momentum liquidando rápido.'
                : 'Paga primero la tarjeta con mayor tasa → ahorras más en intereses.'}
            </p>
            <div className="space-y-3">
              {[...activeCards]
                .filter(c => Math.abs(c.currentBalance) > 0)
                .sort((a, b) => strategy === 'snowball'
                  ? Math.abs(a.currentBalance) - Math.abs(b.currentBalance)
                  : (b.apr || 0) - (a.apr || 0)
                )
                .map((card, i) => {
                  const balance = Math.abs(card.currentBalance);
                  const payment = card.noInterestPayment || card.minimumPayment || 0;
                  const payoff = calculatePayoff(balance, card.apr || 0, payment);
                  const metrics = getCardRiskMetrics(card);
                  return (
                    <div key={card.id} className={cn("card-calm p-4", i === 0 && "ring-2 ring-primary/30")}>
                      {i === 0 && <p className="text-xs font-medium text-primary mb-2">⚡ Prioridad #1</p>}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{card.name}</p>
                            <p className="text-xs text-muted-foreground">{card.bank}</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-danger">{formatMoney(balance)}</p>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                        <div className={cn("h-full rounded-full", metrics.utilization >= 60 ? "bg-danger" : metrics.utilization >= 40 ? "bg-warning" : "bg-primary")}
                          style={{ width: `${Math.min(metrics.utilization, 100)}%` }} />
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>Tasa: {card.apr || 0}%</span>
                        {card.minimumPayment != null && <span>Mínimo: {formatMoney(card.minimumPayment)}</span>}
                        {card.noInterestPayment != null && <span>Sin intereses: {formatMoney(card.noInterestPayment)}</span>}
                        {payoff.months > 0 && payoff.months < Infinity && <span className="text-primary font-medium">~{payoff.months} meses</span>}
                        {payoff.totalInterest > 0 && payoff.totalInterest < Infinity && <span>Intereses: {formatMoney(payoff.totalInterest)}</span>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </div>
      <CardEditor key={editCard?.id ?? (isNew ? 'new' : 'closed')} card={editCard} isNew={isNew} open={!!editCard || isNew} onOpenChange={(o) => { if (!o) { setEditCard(null); setIsNew(false); } }} />
    </Layout>
  );
}
