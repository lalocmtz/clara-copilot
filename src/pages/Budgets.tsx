import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Check, X, Settings, Plus, Trash2 } from "lucide-react";
import CategoryManager from "@/components/CategoryManager";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 60%, 55%)',
  'hsl(340, 55%, 55%)',
];

export default function Budgets() {
  const { budgets, categories, updateBudget, addBudget, deleteBudget, refetchData } = useAppData();

  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Budgets for current period only
  const currentBudgets = useMemo(() => budgets.filter(b => b.period === currentPeriod), [budgets, currentPeriod]);

  // Categories that have a budget vs those that don't
  const activeCategories = categories.filter(c => c.active);
  const categoriesWithBudget = currentBudgets.map(b => b.category);
  const categoriesWithoutBudget = activeCategories.filter(c => !categoriesWithBudget.includes(c.name));

  const totalBudget = currentBudgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = currentBudgets.reduce((s, b) => s + b.spent, 0);
  const quedaPorGastar = totalBudget - totalSpent;

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [tempBudgetAmount, setTempBudgetAmount] = useState('');
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<string | null>(null);

  const startEditBudget = (id: string, current: number) => {
    setEditingBudgetId(id);
    setTempBudgetAmount(current.toString());
  };

  const saveBudgetEdit = async () => {
    if (editingBudgetId && tempBudgetAmount) {
      await updateBudget(editingBudgetId, { budgeted: parseFloat(tempBudgetAmount) });
      refetchData();
    }
    setEditingBudgetId(null);
  };

  const handleAddBudget = async (cat: typeof activeCategories[0]) => {
    const amount = parseFloat(newBudgetAmount);
    if (!amount || amount <= 0) return;
    await addBudget({
      category: cat.name,
      categoryIcon: cat.icon,
      budgeted: amount,
      spent: 0,
      period: currentPeriod,
    });
    refetchData();
    setAddingCategoryId(null);
    setNewBudgetAmount('');
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
    refetchData();
  };

  const monthName = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  // Pie chart data
  const pieData = currentBudgets
    .filter(b => b.spent > 0)
    .map((b, i) => ({
      name: b.category,
      value: b.spent,
      icon: b.categoryIcon,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-sm">
          <span>{d.icon} {d.name}: </span>
          <span className="font-semibold">{formatMoney(d.value)}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Presupuestos</h2>
            <p className="text-muted-foreground text-sm mt-1 capitalize">{monthName}</p>
          </div>
          <button onClick={() => setCategoryManagerOpen(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" /> Categorías
          </button>
        </div>

        {/* Global budget summary - auto-calculated */}
        <div className="card-calm p-5">
          <p className="text-label">Presupuesto mensual total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatMoney(totalBudget)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Suma de todos tus presupuestos por categoría</p>
          <div className="flex gap-6 mt-3 text-sm">
            <div><span className="text-muted-foreground">Gastado: </span><span className="text-foreground font-medium">{formatMoney(totalSpent)}</span></div>
            <div><span className="text-muted-foreground">Te queda: </span><span className={cn("font-medium", quedaPorGastar > 0 ? "text-primary" : "text-danger")}>{formatMoney(quedaPorGastar)}</span></div>
          </div>
        </div>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="card-calm p-5">
            <p className="text-label mb-4">Desglose de gastos</p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.icon} {d.name}</span>
                    <span className="font-medium text-foreground">{totalSpent > 0 ? Math.round((d.value / totalSpent) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Per-category budgets */}
        <div className="card-calm overflow-hidden">
          <div className="hidden sm:grid grid-cols-6 gap-4 p-4 text-label border-b border-border">
            <span>Categoría</span><span className="text-right">Presupuesto</span><span className="text-right">Gastado</span><span className="text-right">Restante</span><span>Progreso</span><span></span>
          </div>
          {currentBudgets.length === 0 && categoriesWithoutBudget.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No tienes presupuestos configurados. Agrega categorías primero.
            </div>
          )}
          {currentBudgets.map((b) => {
            const remaining = b.budgeted - b.spent;
            const pct = b.budgeted > 0 ? Math.min((b.spent / b.budgeted) * 100, 100) : 0;
            const isOver = b.spent > b.budgeted;
            const isEditing = editingBudgetId === b.id;
            const isConfirmingDelete = confirmDeleteBudgetId === b.id;

            if (isConfirmingDelete) {
              return (
                <div key={b.id} className="flex items-center gap-3 p-4 border-b border-border last:border-0">
                  <span>{b.categoryIcon}</span>
                  <span className="text-sm text-foreground">¿Eliminar presupuesto de <strong>{b.category}</strong>?</span>
                  <button onClick={() => handleDeleteBudget(b.id)} className="text-xs text-destructive font-medium px-2">Sí, eliminar</button>
                  <button onClick={() => setConfirmDeleteBudgetId(null)} className="text-xs text-muted-foreground px-2">Cancelar</button>
                </div>
              );
            }

            return (
              <div key={b.id} className="grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-4 p-4 border-b border-border last:border-0 items-center">
                <div className="flex items-center gap-2">
                  <span>{b.categoryIcon}</span>
                  <span className="text-sm font-medium text-foreground">{b.category}</span>
                </div>
                <div className="text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <input type="number" value={tempBudgetAmount} onChange={e => setTempBudgetAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveBudgetEdit()} autoFocus
                        className="w-20 text-sm text-right bg-transparent border-b-2 border-primary outline-none text-foreground" />
                      <button onClick={saveBudgetEdit} className="p-1 text-primary"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingBudgetId(null)} className="p-1 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEditBudget(b.id, b.budgeted)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {formatMoney(b.budgeted)}
                    </button>
                  )}
                </div>
                <span className="text-sm text-right text-foreground font-medium">{formatMoney(b.spent)}</span>
                <span className={cn("text-sm text-right font-medium", isOver ? "text-danger" : "text-success")}>{formatMoney(remaining)}</span>
                <div className="col-span-1">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-500", isOver ? "bg-danger" : pct > 70 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setConfirmDeleteBudgetId(b.id)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Eliminar presupuesto">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Categories without budget */}
        {categoriesWithoutBudget.length > 0 && (
          <div className="card-calm overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="text-label">Categorías sin presupuesto</p>
              <p className="text-xs text-muted-foreground mt-0.5">Asigna un monto para controlar tus gastos</p>
            </div>
            {categoriesWithoutBudget.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-4 border-b border-border last:border-0">
                <span className="text-lg">{cat.icon}</span>
                <span className="flex-1 text-sm font-medium text-foreground">{cat.name}</span>
                {addingCategoryId === cat.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input type="number" value={newBudgetAmount} onChange={e => setNewBudgetAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddBudget(cat)} autoFocus placeholder="0"
                      className="w-24 text-sm text-right bg-transparent border-b-2 border-primary outline-none text-foreground placeholder:text-muted-foreground/40" />
                    <button onClick={() => handleAddBudget(cat)} className="p-1 text-primary"><Check className="w-4 h-4" /></button>
                    <button onClick={() => { setAddingCategoryId(null); setNewBudgetAmount(''); }} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => setAddingCategoryId(cat.id)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                    <Plus className="w-4 h-4" /> Asignar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <QuickAddTransaction />
      <CategoryManager open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen} />
    </Layout>
  );
}
