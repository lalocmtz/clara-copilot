import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { useAppData } from "@/context/AppContext";
import { Lightbulb, AlertTriangle, ArrowRight } from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

const colorMap: Record<string, string> = {
  relevant: 'bg-primary/10 text-primary',
  risk: 'bg-warning/10 text-warning',
  action: 'bg-sidebar-accent text-sidebar-accent-foreground',
};

export default function Insights() {
  const navigate = useNavigate();
  const { topCategories, budgets, monthlyTotals } = useAppData();

  const insights = useMemo(() => {
    const top = topCategories[0];
    const totalBudget = budgets.reduce((s, b) => s + b.budgeted, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    const result = [];

    if (top) {
      result.push({
        type: 'relevant', icon: Lightbulb, title: 'Lo más relevante',
        message: `${top.name} representa ${top.percentage}% de tu gasto este mes (${formatMoney(top.amount)}).`,
        action: { label: 'Revisar gastos', route: '/transactions' },
      });
    }

    if (pct > 70) {
      result.push({
        type: 'risk', icon: AlertTriangle, title: 'Riesgos',
        message: `Llevas ${pct}% del presupuesto usado. ${pct > 90 ? 'Estás por encima del límite.' : 'Estás cerca del límite.'}`,
        action: { label: 'Ajustar presupuesto', route: '/budgets' },
      });
    }

    result.push({
      type: 'action', icon: ArrowRight, title: 'Siguiente mejor acción',
      message: monthlyTotals.income > monthlyTotals.expenses
        ? 'Tu flujo es positivo este mes. Buen momento para ahorrar o invertir.'
        : 'Tus gastos superan tus ingresos. Revisa dónde puedes ajustar.',
      action: { label: 'Ver presupuestos', route: '/budgets' },
    });

    return result;
  }, [topCategories, budgets, monthlyTotals]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Insights</h2>
          <p className="text-muted-foreground text-sm mt-1">Orientación tranquila para tu dinero</p>
        </div>

        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.type} className="card-calm p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[insight.type]}`}>
                  <insight.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{insight.message}</p>
                  <button onClick={() => navigate(insight.action.route)}
                    className="mt-3 text-xs font-medium text-primary hover:underline transition-colors flex items-center gap-1">
                    {insight.action.label}<ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card-calm p-5 text-center">
          <p className="text-sm text-muted-foreground">Nada urgente. Todo claro. ✨</p>
        </div>
      </div>
      <QuickAddTransaction />
    </Layout>
  );
}
