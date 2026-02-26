import { useState, useMemo } from "react";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import TransactionEditor from "@/components/TransactionEditor";
import { useAppData } from "@/context/AppContext";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Transaction } from "@/lib/mock-data";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1);
  const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function Index() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const { transactions, accounts, budgets, subscriptions, investments } = useAppData();

  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date('2026-02-26')));

  const goMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta);
    setSelectedMonth(getMonthKey(d));
  };

  // Filter transactions for selected month
  const monthTxs = useMemo(() =>
    transactions.filter(t => t.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const monthlyTotals = useMemo(() => ({
    income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expenses: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [monthTxs]);

  const topCategories = useMemo(() => {
    const expenseTx = monthTxs.filter(t => t.type === 'expense');
    const totalExp = expenseTx.reduce((s, t) => s + t.amount, 0);
    const byCategory: Record<string, { amount: number; icon: string }> = {};
    expenseTx.forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category] = { amount: 0, icon: t.categoryIcon };
      byCategory[t.category].amount += t.amount;
    });
    return Object.entries(byCategory)
      .map(([name, { amount, icon }]) => ({ name, icon, amount, percentage: totalExp ? Math.round((amount / totalExp) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthTxs]);

  // Budget for selected month
  const monthBudgets = budgets.filter(b => b.period === selectedMonth);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + b.spent, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const budgetBarColor = budgetPct < 70 ? 'bg-primary' : budgetPct < 90 ? 'bg-warning' : 'bg-danger';

  const liquidez = accounts.filter(a => a.type === 'checking' || a.type === 'savings').reduce((s, a) => s + a.balance, 0);
  const creditoDisponible = accounts.filter(a => a.type === 'credit' && a.creditLimit).reduce((s, a) => s + ((a.creditLimit ?? 0) - Math.abs(a.balance)), 0);
  const deudaTarjetas = Math.abs(accounts.filter(a => a.type === 'credit').reduce((s, a) => s + a.balance, 0));
  const deudasExternas = Math.abs(accounts.filter(a => a.type === 'debt').reduce((s, a) => s + a.balance, 0));
  const invested = investments.reduce((s, i) => s + i.current_value, 0);
  const capitalTotal = liquidez + invested - deudaTarjetas - deudasExternas;

  const recentTransactions = monthTxs.slice(0, 5);

  // Upcoming payments (always current)
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
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tu panorama</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => goMonth(-1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
              {formatMonthLabel(selectedMonth)}
            </span>
            <button onClick={() => goMonth(1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Capital total */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="card-calm p-6">
          <p className="text-label mb-1">Capital total</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">{formatMoney(capitalTotal)}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
            <div><span className="text-muted-foreground">Líquido: </span><span className="text-foreground font-medium">{formatMoney(liquidez)}</span></div>
            <div><span className="text-muted-foreground">Crédito disponible: </span><span className="text-foreground font-medium">{formatMoney(creditoDisponible)}</span></div>
            <div><span className="text-muted-foreground">Invertido: </span><span className="text-foreground font-medium">{formatMoney(invested)}</span></div>
            <div><span className="text-muted-foreground">Deuda tarjetas: </span><span className="text-danger font-medium">–{formatMoney(deudaTarjetas)}</span></div>
            {deudasExternas > 0 && (
              <div><span className="text-muted-foreground">Deudas externas: </span><span className="text-danger font-medium">–{formatMoney(deudasExternas)}</span></div>
            )}
          </div>
        </motion.div>

        {/* Balance del mes */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
          <div className="card-calm p-4 text-center">
            <p className="text-label">Ingresos</p>
            <p className="text-lg font-semibold text-success mt-1">+{formatMoney(monthlyTotals.income)}</p>
          </div>
          <div className="card-calm p-4 text-center">
            <p className="text-label">Gastos</p>
            <p className="text-lg font-semibold text-foreground mt-1">–{formatMoney(monthlyTotals.expenses)}</p>
          </div>
        </motion.div>
        {(() => {
          const neto = monthlyTotals.income - monthlyTotals.expenses;
          return (
            <p className={`text-xs text-center -mt-4 ${neto >= 0 ? 'text-success' : 'text-danger'}`}>
              Balance neto: {neto >= 0 ? '+' : ''}{formatMoney(neto)}
            </p>
          );
        })()}

        {/* Budget bar */}
        {totalBudget > 0 && (
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
        )}

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
          {topCategories.length > 0 ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">Sin gastos en este mes.</p>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="card-calm p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Últimos movimientos</h3>
          {recentTransactions.length > 0 ? (
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
                  <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-success' : tx.type === 'transfer' ? 'text-warning' : 'text-foreground'}`}>
                    {tx.type === 'expense' ? '–' : tx.type === 'transfer' ? '↔' : '+'} {formatMoney(tx.amount)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin movimientos en este mes.</p>
          )}
        </motion.div>
      </div>

      <QuickAddTransaction open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <TransactionEditor transaction={editTx} open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)} />
    </Layout>
  );
}
