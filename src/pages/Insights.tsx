import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { Lightbulb, AlertTriangle, ArrowRight } from "lucide-react";

const insights = [
  {
    type: 'relevant',
    icon: Lightbulb,
    title: 'Lo más relevante',
    message: 'Ads representa 42% de tu gasto este mes. Es tu categoría más alta.',
    action: { label: 'Revisar gastos', route: '/transactions' },
  },
  {
    type: 'risk',
    icon: AlertTriangle,
    title: 'Riesgos',
    message: 'Si sigues al ritmo actual, superarías tu presupuesto de Ads por $2,300 al cierre del mes.',
    action: { label: 'Ajustar presupuesto', route: '/budgets' },
  },
  {
    type: 'action',
    icon: ArrowRight,
    title: 'Siguiente mejor acción',
    message: 'Podrías reducir ocio esta semana o ajustar el presupuesto de Ads. Tú decides el ritmo.',
    action: { label: 'Ver presupuestos', route: '/budgets' },
  },
];

const colorMap: Record<string, string> = {
  relevant: 'bg-primary/10 text-primary',
  risk: 'bg-warning/10 text-warning',
  action: 'bg-sidebar-accent text-sidebar-accent-foreground',
};

export default function Insights() {
  const navigate = useNavigate();

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
                  <button
                    onClick={() => navigate(insight.action.route)}
                    className="mt-3 text-xs font-medium text-primary hover:underline transition-colors flex items-center gap-1"
                  >
                    {insight.action.label}
                    <ArrowRight className="w-3 h-3" />
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
