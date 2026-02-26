import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { budgets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

export default function Budgets() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Presupuestos</h2>
          <p className="text-muted-foreground text-sm mt-1">Febrero 2026</p>
        </div>

        <div className="card-calm overflow-hidden">
          <div className="hidden sm:grid grid-cols-5 gap-4 p-4 text-label border-b border-border">
            <span>Categoría</span>
            <span className="text-right">Presupuesto</span>
            <span className="text-right">Gastado</span>
            <span className="text-right">Restante</span>
            <span>Progreso</span>
          </div>
          {budgets.map((b) => {
            const remaining = b.budgeted - b.spent;
            const pct = Math.min((b.spent / b.budgeted) * 100, 100);
            const isOver = b.spent > b.budgeted;
            return (
              <div key={b.id} className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 p-4 border-b border-border last:border-0 items-center">
                <div className="flex items-center gap-2">
                  <span>{b.categoryIcon}</span>
                  <span className="text-sm font-medium text-foreground">{b.category}</span>
                </div>
                <span className="text-sm text-right text-muted-foreground">{formatMoney(b.budgeted)}</span>
                <span className="text-sm text-right text-foreground font-medium">{formatMoney(b.spent)}</span>
                <span className={cn("text-sm text-right font-medium", isOver ? "text-danger" : "text-success")}>
                  {formatMoney(remaining)}
                </span>
                <div className="col-span-2 sm:col-span-1">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", isOver ? "bg-danger" : pct > 70 ? "bg-warning" : "bg-primary")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <QuickAddTransaction />
    </Layout>
  );
}
