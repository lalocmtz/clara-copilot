import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { monthlyTotals, topCategories, transactions, spendingVsBudget, budgets } from "@/lib/mock-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

function getBudgetStatus() {
  const totalBudget = budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const ratio = totalSpent / totalBudget;
  if (ratio < 0.7) return { color: 'bg-success', label: '🟢 Vas con margen', message: 'Todo tranquilo. Sigue así.' };
  if (ratio < 0.9) return { color: 'bg-warning', label: '🟡 Estás cerca del límite', message: 'No pasa nada. Puedes ajustar cuando quieras.' };
  return { color: 'bg-danger', label: '🔴 Te estás pasando', message: 'No pasa nada. Puedes ajustar cuando quieras.' };
}

export default function Index() {
  const status = getBudgetStatus();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div {...fadeIn}>
          <h2 className="text-2xl font-bold text-foreground">Tu panorama</h2>
          <p className="text-muted-foreground text-sm mt-1">Febrero 2026</p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-calm p-5">
            <p className="text-label">Disponible</p>
            <p className="text-number mt-1">{formatMoney(monthlyTotals.available)}</p>
            <p className="text-xs text-muted-foreground mt-1">Lo que tienes hoy</p>
          </div>
          <div className="card-calm p-5">
            <p className="text-label">Deuda tarjetas</p>
            <p className="text-number mt-1">{formatMoney(monthlyTotals.creditDebt)}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendiente por pagar</p>
          </div>
          <div className="card-calm p-5">
            <p className="text-label">Flujo del mes</p>
            <p className="text-number mt-1 text-success">{formatMoney(monthlyTotals.income - monthlyTotals.expenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">Cómo vas este mes</p>
          </div>
        </motion.div>

        {/* Budget Status */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="card-calm p-5">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            <p className="font-medium text-foreground">{status.label}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{status.message}</p>
        </motion.div>

        {/* Chart */}
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="card-calm p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Gasto acumulado vs Presupuesto</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendingVsBudget}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid hsl(220 13% 91%)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  formatter={(value: number) => [formatMoney(value), '']}
                />
                <Line type="monotone" dataKey="spent" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} name="Gastado" />
                <Line type="monotone" dataKey="budget" stroke="hsl(220 13% 91%)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Presupuesto" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Categories */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="card-calm p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Top 5 categorías</h3>
          <div className="space-y-3">
            {topCategories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-foreground">{cat.name}</span>
                    <span className="text-sm font-medium text-foreground">{formatMoney(cat.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="card-calm p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Últimos movimientos</h3>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tx.categoryIcon}</span>
                  <div>
                    <p className="text-sm text-foreground">{tx.merchant || tx.notes || tx.category}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                  {tx.type === 'expense' ? '–' : '+'} {formatMoney(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <QuickAddTransaction />
    </Layout>
  );
}
