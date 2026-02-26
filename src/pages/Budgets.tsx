import { useState } from "react";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { budgets } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Pencil, Settings } from "lucide-react";
import CategoryManager from "@/components/CategoryManager";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

export default function Budgets() {
  const totalBudget = budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const quedaPorGastar = totalBudget - totalSpent;

  const [editingTotal, setEditingTotal] = useState(false);
  const [tempTotal, setTempTotal] = useState(totalBudget.toString());
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Presupuestos</h2>
            <p className="text-muted-foreground text-sm mt-1">Febrero 2026</p>
          </div>
          <button
            onClick={() => setCategoryManagerOpen(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Categorías
          </button>
        </div>

        {/* Presupuesto global */}
        <div className="card-calm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label">Presupuesto mensual total</p>
              {editingTotal ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-foreground font-medium">$</span>
                  <input
                    type="number"
                    value={tempTotal}
                    onChange={(e) => setTempTotal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingTotal(false)}
                    autoFocus
                    className="text-2xl font-bold text-foreground bg-transparent outline-none w-32 border-b-2 border-primary"
                  />
                  <button
                    onClick={() => setEditingTotal(false)}
                    className="text-xs text-primary font-medium"
                  >
                    Listo
                  </button>
                </div>
              ) : (
                <p className="text-2xl font-bold text-foreground mt-1">{formatMoney(totalBudget)}</p>
              )}
            </div>
            {!editingTotal && (
              <button onClick={() => setEditingTotal(true)} className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Gastado: </span>
              <span className="text-foreground font-medium">{formatMoney(totalSpent)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Te queda: </span>
              <span className={cn("font-medium", quedaPorGastar > 0 ? "text-primary" : "text-danger")}>
                {formatMoney(quedaPorGastar)}
              </span>
            </div>
          </div>
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
      <CategoryManager open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen} />
    </Layout>
  );
}
