import { useState } from "react";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import SubscriptionEditor from "@/components/SubscriptionEditor";
import { useAppData } from "@/context/AppContext";
import { Check, Plus, ChevronDown, Monitor, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/lib/mock-data";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

function monthlyEquivalent(sub: Subscription) {
  return sub.frequency === 'yearly' ? sub.amount / 12 : sub.amount;
}

function annualEquivalent(sub: Subscription) {
  return sub.frequency === 'monthly' ? sub.amount * 12 : sub.amount;
}

export default function Subscriptions() {
  const { subscriptions, updateSubscription } = useAppData();
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [digitalOpen, setDigitalOpen] = useState(true);
  const [fixedOpen, setFixedOpen] = useState(true);

  const totalMonthly = subscriptions.reduce((s, sub) => s + monthlyEquivalent(sub), 0);
  const totalAnnual = subscriptions.reduce((s, sub) => s + annualEquivalent(sub), 0);
  const paidCount = subscriptions.filter(s => s.paid).length;
  const totalCount = subscriptions.length;
  const progressPct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  const digital = subscriptions.filter(s => (s.subType || 'digital') === 'digital');
  const fixed = subscriptions.filter(s => s.subType === 'fixed');
  const digitalTotal = digital.reduce((s, sub) => s + monthlyEquivalent(sub), 0);
  const fixedTotal = fixed.reduce((s, sub) => s + monthlyEquivalent(sub), 0);

  const togglePaid = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const sub = subscriptions.find(s => s.id === id);
    if (sub) updateSubscription(id, { paid: !sub.paid });
  };

  const openNew = () => { setEditSub(null); setIsNew(true); };

  const renderItem = (sub: Subscription) => (
    <button key={sub.id} onClick={() => { setEditSub(sub); setIsNew(false); }}
      className="flex items-center justify-between p-4 w-full text-left hover:bg-accent/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg shrink-0">{sub.categoryIcon || '🔄'}</span>
        <div className="min-w-0">
          <p className={cn("text-sm font-medium truncate", sub.paid ? "text-muted-foreground line-through" : "text-foreground")}>{sub.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatMoney(sub.amount)} · {sub.frequency === 'monthly' ? 'Mensual' : 'Anual'}</span>
            <span>·</span>
            <span>Día {sub.billingDay || '—'}</span>
          </div>
          {sub.frequency === 'monthly' ? (
            <p className="text-xs text-muted-foreground/70">{formatMoney(annualEquivalent(sub))}/año</p>
          ) : (
            <p className="text-xs text-muted-foreground/70">{formatMoney(monthlyEquivalent(sub))}/mes</p>
          )}
        </div>
      </div>
      <div onClick={(e) => togglePaid(e, sub.id)}
        className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0",
          sub.paid ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
        <Check className="w-4 h-4" />
      </div>
    </button>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Suscripciones y Fijos</h2>
            <p className="text-muted-foreground text-sm mt-1">{paidCount} de {totalCount} pagadas este mes</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-calm p-4">
            <p className="text-xs text-muted-foreground">Total mensual</p>
            <p className="text-lg font-bold text-foreground">{formatMoney(totalMonthly)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-xs text-muted-foreground">Total anual</p>
            <p className="text-lg font-bold text-foreground">{formatMoney(totalAnnual)}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="card-calm p-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso del mes</span>
            <span>{paidCount}/{totalCount}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Digital Subscriptions */}
        <Collapsible open={digitalOpen} onOpenChange={setDigitalOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 card-calm rounded-xl">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Suscripciones digitales</span>
              <span className="text-xs text-muted-foreground">({digital.length})</span>
              <span className="text-xs font-medium text-primary ml-auto mr-2">{formatMoney(digitalTotal)}/mes</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", digitalOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="card-calm divide-y divide-border mt-2 rounded-xl overflow-hidden">
              {digital.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Sin suscripciones digitales</p>
              ) : digital.map(renderItem)}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Fixed Expenses */}
        <Collapsible open={fixedOpen} onOpenChange={setFixedOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 card-calm rounded-xl">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Gastos fijos</span>
              <span className="text-xs text-muted-foreground">({fixed.length})</span>
              <span className="text-xs font-medium text-primary ml-auto mr-2">{formatMoney(fixedTotal)}/mes</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", fixedOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="card-calm divide-y divide-border mt-2 rounded-xl overflow-hidden">
              {fixed.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Sin gastos fijos</p>
              ) : fixed.map(renderItem)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      <QuickAddTransaction />
      <SubscriptionEditor subscription={editSub} isNew={isNew} open={!!editSub || isNew} onOpenChange={(o) => { if (!o) { setEditSub(null); setIsNew(false); } }} />
    </Layout>
  );
}
