import { useState } from "react";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import SubscriptionEditor from "@/components/SubscriptionEditor";
import { useAppData } from "@/context/AppContext";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/lib/mock-data";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

export default function Subscriptions() {
  const { subscriptions, updateSubscription } = useAppData();
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [isNew, setIsNew] = useState(false);
  const total = subscriptions.reduce((s, sub) => s + sub.amount, 0);

  const togglePaid = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const sub = subscriptions.find(s => s.id === id);
    if (sub) updateSubscription(id, { paid: !sub.paid });
  };

  const openNew = () => { setEditSub(null); setIsNew(true); };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Suscripciones</h2>
            <p className="text-muted-foreground text-sm mt-1">{formatMoney(total)} /mes en total</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        <div className="card-calm divide-y divide-border">
          {subscriptions.map((sub) => (
            <button key={sub.id} onClick={() => { setEditSub(sub); setIsNew(false); }}
              className="flex items-center justify-between p-4 w-full text-left hover:bg-accent/30 transition-colors">
              <div>
                <p className={cn("text-sm font-medium", sub.paid ? "text-muted-foreground line-through" : "text-foreground")}>{sub.name}</p>
                <p className="text-xs text-muted-foreground">{formatMoney(sub.amount)} · {sub.frequency === 'monthly' ? 'Mensual' : 'Anual'} · Próximo: {sub.nextDate}</p>
              </div>
              <div onClick={(e) => togglePaid(e, sub.id)}
                className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  sub.paid ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                <Check className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
      <QuickAddTransaction />
      <SubscriptionEditor subscription={editSub} isNew={isNew} open={!!editSub || isNew} onOpenChange={(o) => { if (!o) { setEditSub(null); setIsNew(false); } }} />
    </Layout>
  );
}
