import { useState } from "react";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { subscriptions as initialSubs } from "@/lib/mock-data";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

export default function Subscriptions() {
  const [subs, setSubs] = useState(initialSubs);
  const total = subs.reduce((s, sub) => s + sub.amount, 0);

  const togglePaid = (id: string) => {
    setSubs(subs.map(s => s.id === id ? { ...s, paid: !s.paid } : s));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suscripciones</h2>
          <p className="text-muted-foreground text-sm mt-1">{formatMoney(total)} /mes en total</p>
        </div>

        <div className="card-calm divide-y divide-border">
          {subs.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-4">
              <div>
                <p className={cn("text-sm font-medium", sub.paid ? "text-muted-foreground line-through" : "text-foreground")}>
                  {sub.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(sub.amount)} · {sub.frequency === 'monthly' ? 'Mensual' : 'Anual'} · Próximo: {sub.nextDate}
                </p>
              </div>
              <button
                onClick={() => togglePaid(sub.id)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  sub.paid ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent"
                )}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <QuickAddTransaction />
    </Layout>
  );
}
