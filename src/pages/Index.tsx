import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import TransactionEditor from "@/components/TransactionEditor";
import { useAppData } from "@/context/AppContext";
import { Plus, SlidersHorizontal, Wallet, CalendarClock } from "lucide-react";
import TelegramLink from "@/components/TelegramLink";
import type { Transaction } from "@/lib/mock-data";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

export default function Index() {
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const { transactions, accounts, budgets, subscriptions, investments, monthlyTotals, topCategories } = useAppData();

  const totalBudget = budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const budgetBarColor = budgetPct < 70 ? 'bg-primary' : budgetPct < 90 ? 'bg-warning' : 'bg-danger';

  const liquidez = accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + a.balance, 0);
  const deuda = Math.abs(accounts.filter(a => a.type === 'credit').reduce((s, a) => s + a.balance, 0));
  const invested = investments.reduce((s, i) => s + i.current_value, 0);
  const capitalTotal = liquidez + invested - deuda;

  const quedaPorGastar = totalBudget - totalSpent;
  const recentTransactions = transactions.slice(0, 5);

  // Upcoming payments
  const now = new Date('2026-02-26');
  const in14 = new Date(now); in14.setDate(in14.getDate() + 14);
  const upcomingPayments: { name: string; amount: number; date: string }[] = [];
  accounts.filter(a => a.type === 'credit' && a.paymentDate).forEach(acc => {
    const payDate = new Date(2026, 2, acc.paymentDate!);
    if (payDate >= now && payDate <= in14) upcomingPayments.push({ name: acc.name, amount: Math.abs(acc.balance), date: payDate.toISOString().slice(0, 10) });
  });
  subscriptions.filter(s => !s.paid).forEach(sub => {
    const d = new Date(sub.nextDate);
    if (d >= now && d <= in14) upcomingPayments.push({ name: sub.name, amount: sub.amount, date: sub.nextDate });
  });
  upcomingPayments.sort((a, b) => a.date.localeCompare(b.date));

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  return (
    <Layout>
      <div className="space-y-8">
        <motion.div {...fadeIn}>
          <h2 className="text-2xl font-bold text-foreground">Tu panorama</h2>
          <p className="text-muted-foreground text-sm mt-1">Febrero 2026</p>
        </motion.div>

        {/* Capital total */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="card-calm p-6">
          <p className="text-label mb-1">Capital total</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">{formatMoney(capitalTotal)}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm">
            <div><span className="text-muted-foreground">Disponible: </span><span className="text-foreground font-medium">{formatMoney(liquidez)}</span></div>
            <div><span className="text-muted-foreground">Invertido: </span><span className="text-foreground font-medium">{formatMoney(invested)}</span></div>
            <div><span className="text-muted-foreground">Deuda: </span><span className="text-danger font-medium">–{formatMoney(deuda)}</span></div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeIn} transition={{ delay: 0.08 }} className="grid grid-cols-4 gap-3">
          <button onClick={() => setQuickAddOpen(true)} className="card-calm p-3 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors">
            <Plus className="w-5 h-5 text-primary" /><span className="text-xs font-medium text-foreground">Registrar</span>
          </button>
          <button onClick={() => navigate('/budgets')} className="card-calm p-3 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors">
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" /><span className="text-xs font-medium text-foreground">Presupuesto</span>
          </button>
          <button onClick={() => navigate('/accounts')} className="card-calm p-3 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors">
            <Wallet className="w-5 h-5 text-muted-foreground" /><span className="text-xs font-medium text-foreground">Balances</span>
          </button>
          <TelegramLink />
        </motion.div>

        {/* Este mes */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
          <div className="card-calm p-4 text-center">
            <p className="text-label">Ganado</p>
            <p className="text-lg font-semibold text-success mt-1">+{formatMoney(monthlyTotals.income)}</p>
          </div>
          <div className="card-calm p-4 text-center">
            <p className="text-label">Gastado</p>
            <p className="text-lg font-semibold text-foreground mt-1">–{formatMoney(monthlyTotals.expenses)}</p>
          </div>
          <div className="card-calm p-4 text-center">
            <p className="text-label">Te queda</p>
            <p className={`text-lg font-semibold mt-1 ${quedaPorGastar > 0 ? 'text-primary' : 'text-danger'}`}>{formatMoney(quedaPorGastar)}</p>
          </div>
        </motion.div>

        {/* Budget bar */}
        <motion.div {...fadeIn} transition={{ delay: 0.13 }} className="card-calm p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-foreground">Presupuesto mensual</p>
            <p className="text-sm text-muted-foreground">{budgetPct}% usado</p>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${budgetBarColor}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {budgetPct < 70 ? '🟢 Vas con margen.' : budgetPct < 90 ? '🟡 Estás cerca del límite.' : '🔴 Te estás pasando.'}
          </p>
        </motion.div>

        {/* Pagos próximos */}
        {upcomingPayments.length > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.16 }} className="card-calm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Pagos próximos</h3>
            </div>
            <div className="space-y-3">
              {upcomingPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div><p className="text-sm text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{formatDate(p.date)}</p></div>
                  <span className="text-sm font-medium text-foreground">{formatMoney(p.amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

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
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions — clickable */}
        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="card-calm p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Últimos movimientos</h3>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <button key={tx.id} onClick={() => setEditTx(tx)} className="flex items-center justify-between py-1 w-full text-left hover:bg-accent/30 rounded-lg px-2 -mx-2 transition-colors">
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
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <QuickAddTransaction open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <TransactionEditor transaction={editTx} open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)} />
    </Layout>
  );
}
