import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import TransactionEditor from "@/components/TransactionEditor";
import { useAppData } from "@/context/AppContext";
import { useCreditCards, getUtilizationPct, getRiskLevel } from "@/services/credit-cards";
import { useDebts } from "@/services/debts";
import { useReceivables } from "@/services/receivables";
import { useJarSettings, distributeIncome, JAR_LABELS, JAR_ICONS, type JarType } from "@/services/allocations";
import { useFinancialPreferences } from "@/services/preferences";
import { useFinancialPosition } from "@/services/financial-position";
import { CalendarClock, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight, CreditCard, Target, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
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

const jarOrder: JarType[] = ['necessities', 'financial_freedom', 'education', 'play', 'long_term_savings', 'give'];

export default function Index() {
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const { transactions, budgets, subscriptions } = useAppData();
  const { data: creditCards = [] } = useCreditCards();
  const { data: receivables = [] } = useReceivables();
  const { data: jarSettings } = useJarSettings();
  const { data: prefs } = useFinancialPreferences();
  const pos = useFinancialPosition();

  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()));

  const goMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta);
    setSelectedMonth(getMonthKey(d));
  };

  const monthTxs = useMemo(() => transactions.filter(t => t.date.startsWith(selectedMonth)), [transactions, selectedMonth]);

  const monthlyTotals = useMemo(() => ({
    income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expenses: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [monthTxs]);

  // Budget
  const monthBudgets = budgets.filter(b => b.period === selectedMonth);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + b.spent, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Risk cards
  const riskyCards = creditCards.filter(c => c.active && getUtilizationPct(c) >= 60);
  const overBudgets = monthBudgets.filter(b => b.budgeted > 0 && b.spent > b.budgeted);
  const pendingReceivables = receivables.filter(r => r.status !== 'paid' && r.status !== 'cancelled');
  const totalReceivable = pendingReceivables.reduce((s, r) => s + (r.amountTotal - r.amountPaid), 0);

  // Income goal
  const incomeGoal = prefs?.monthlyIncomeGoal || 0;
  const incomeProgress = incomeGoal > 0 ? Math.round((monthlyTotals.income / incomeGoal) * 100) : 0;

  // Upcoming payments (only from credit_cards, not accounts.credit)
  const now = new Date();
  const in14 = new Date(now); in14.setDate(in14.getDate() + 14);
  const upcomingPayments: { name: string; amount: number; date: string }[] = [];
  creditCards.filter(c => c.active && c.dueDay).forEach(cc => {
    const payDate = new Date(now.getFullYear(), now.getMonth(), cc.dueDay!);
    if (payDate < now) payDate.setMonth(payDate.getMonth() + 1);
    if (payDate >= now && payDate <= in14) upcomingPayments.push({ name: cc.name, amount: cc.noInterestPayment || cc.minimumPayment || Math.abs(cc.currentBalance), date: payDate.toISOString().slice(0, 10) });
  });
  subscriptions.filter(s => !s.paid).forEach(sub => {
    const d = new Date(sub.nextDate);
    if (d >= now && d <= in14) upcomingPayments.push({ name: sub.name, amount: sub.amount, date: sub.nextDate });
  });
  upcomingPayments.sort((a, b) => a.date.localeCompare(b.date));

  // Jar distribution
  const defaultSettings = { necessities: 55, financialFreedom: 10, education: 10, play: 10, longTermSavings: 10, give: 5 };
  const settings = jarSettings || { ...defaultSettings, id: '', userId: '', effectiveFrom: '' };
  const distribution = distributeIncome(monthlyTotals.income, settings as any);

  // Top categories
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
      .sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [monthTxs]);

  const recentTransactions = monthTxs.slice(0, 5);

  // Actions
  const actions: { icon: string; message: string; route: string }[] = [];
  if (riskyCards.length > 0) actions.push({ icon: '🔴', message: `${riskyCards[0].name} está al ${getUtilizationPct(riskyCards[0])}% de utilización`, route: '/cards' });
  if (overBudgets.length > 0) actions.push({ icon: '⚠️', message: `${overBudgets[0].category} se pasó del presupuesto`, route: '/budgets' });
  if (pendingReceivables.length > 0) actions.push({ icon: '💰', message: `Te deben ${formatMoney(totalReceivable)} (${pendingReceivables.length} pendientes)`, route: '/receivables' });
  if (incomeGoal > 0 && incomeProgress < 100) actions.push({ icon: '🎯', message: `Llevas ${incomeProgress}% de tu meta de ingresos`, route: '/income' });
  if (upcomingPayments.length > 0) actions.push({ icon: '📅', message: `${upcomingPayments[0].name}: ${formatMoney(upcomingPayments[0].amount)} próximamente`, route: '/transactions' });

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header + month selector */}
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Tu panorama</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => goMonth(-1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[140px] text-center">{formatMonthLabel(selectedMonth)}</span>
            <button onClick={() => goMonth(1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* ===== ZONE 1: ESTADO GENERAL ===== */}

        {/* Financial position — clear labels */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="card-calm p-6">
          <p className="text-label mb-1">Liquidez real</p>
          <p className="text-xs text-muted-foreground mb-2">Lo que sí tienes hoy</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">{formatMoney(pos.realLiquidity)}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
            <div><span className="text-muted-foreground">Invertido: </span><span className="text-foreground font-medium">{formatMoney(pos.investmentTotal)}</span></div>
            <div><span className="text-muted-foreground">Crédito disp.: </span><span className="text-primary font-medium">{formatMoney(pos.totalCreditAvailable)}</span></div>
            {pos.totalCardDebt > 0 && <div><span className="text-muted-foreground">Deuda tarjetas: </span><span className="text-danger font-medium">–{formatMoney(pos.totalCardDebt)}</span></div>}
            {pos.totalNonCardDebt > 0 && <div><span className="text-muted-foreground">Otras deudas: </span><span className="text-danger font-medium">–{formatMoney(pos.totalNonCardDebt)}</span></div>}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacidad inmediata</span>
            <span className="font-semibold text-foreground">{formatMoney(pos.immediateCapacity)}</span>
          </div>
        </motion.div>

        {/* Income / Expenses / Net */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
          <div className="card-calm p-4 text-center">
            <p className="text-label">Ingresos</p>
            <p className="text-lg font-semibold text-success mt-1">+{formatMoney(monthlyTotals.income)}</p>
          </div>
          <div className="card-calm p-4 text-center">
            <p className="text-label">Gastos</p>
            <p className="text-lg font-semibold text-foreground mt-1">–{formatMoney(monthlyTotals.expenses)}</p>
          </div>
          <div className="card-calm p-4 text-center">
            <p className="text-label">Flujo neto</p>
            {(() => { const n = monthlyTotals.income - monthlyTotals.expenses; return <p className={cn("text-lg font-semibold mt-1", n >= 0 ? "text-success" : "text-danger")}>{n >= 0 ? '+' : ''}{formatMoney(n)}</p> })()}
          </div>
        </motion.div>

        {/* Income goal progress */}
        {incomeGoal > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.12 }} className="card-calm p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Meta de ingresos: {formatMoney(incomeGoal)}</span>
              <span>{incomeProgress}%</span>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", incomeProgress >= 100 ? "bg-success" : incomeProgress >= 70 ? "bg-primary" : "bg-warning")} style={{ width: `${Math.min(incomeProgress, 100)}%` }} />
            </div>
          </motion.div>
        )}

        {/* Budget bar */}
        {totalBudget > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.14 }} className="card-calm p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-foreground">Presupuesto mensual</p>
              <p className="text-sm text-muted-foreground">{budgetPct}% usado</p>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-500", budgetPct < 70 ? "bg-primary" : budgetPct < 90 ? "bg-warning" : "bg-danger")} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetPct < 70 ? '🟢 Vas con margen.' : budgetPct < 90 ? '🟡 Cerca del límite.' : '🔴 Te estás pasando.'}
            </p>
          </motion.div>
        )}

        {/* ===== ZONE 2: FOCOS DE RIESGO ===== */}
        {(riskyCards.length > 0 || overBudgets.length > 0 || pendingReceivables.length > 0) && (
          <motion.div {...fadeIn} transition={{ delay: 0.16 }}>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Focos de atención
            </h3>
            <div className="space-y-2">
              {riskyCards.map(cc => (
                <button key={cc.id} onClick={() => navigate('/cards')} className="card-calm w-full p-3 text-left hover:bg-accent/30 transition-colors flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-danger" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{cc.name} — {getUtilizationPct(cc)}% utilización</p>
                    <p className="text-xs text-muted-foreground">{cc.bank}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
              {pendingReceivables.length > 0 && (
                <button onClick={() => navigate('/receivables')} className="card-calm w-full p-3 text-left hover:bg-accent/30 transition-colors flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-warning" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Te deben {formatMoney(totalReceivable)}</p>
                    <p className="text-xs text-muted-foreground">{pendingReceivables.length} pendiente{pendingReceivables.length > 1 ? 's' : ''}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== ZONE 3: ACCIONES SUGERIDAS ===== */}
        {actions.length > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.18 }}>
            <h3 className="text-sm font-medium text-foreground mb-3">Acciones sugeridas</h3>
            <div className="space-y-2">
              {actions.slice(0, 4).map((a, i) => (
                <button key={i} onClick={() => navigate(a.route)} className="card-calm w-full p-3 text-left hover:bg-accent/30 transition-colors flex items-center gap-3">
                  <span className="text-lg">{a.icon}</span>
                  <p className="text-sm text-foreground flex-1">{a.message}</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Jar distribution mini */}
        {jarSettings && monthlyTotals.income > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="card-calm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Frascos del mes</p>
              <button onClick={() => navigate('/income')} className="text-xs text-primary hover:underline">Ver detalle</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {jarOrder.slice(0, 3).map(jar => (
                <div key={jar} className="text-center">
                  <span className="text-lg">{JAR_ICONS[jar]}</span>
                  <p className="text-xs text-muted-foreground mt-1">{JAR_LABELS[jar]}</p>
                  <p className="text-sm font-semibold text-foreground">{formatMoney(distribution[jar])}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pagos próximos */}
        {upcomingPayments.length > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.22 }} className="card-calm p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Pagos próximos</h3>
            </div>
            <div className="space-y-2">
              {upcomingPayments.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div><p className="text-sm text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{formatDate(p.date)}</p></div>
                  <span className="text-sm font-medium text-foreground">{formatMoney(p.amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.24 }} className="card-calm p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Top categorías</h3>
            <div className="space-y-2">
              {topCategories.map(cat => (
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
        )}

        {/* Recent transactions */}
        {recentTransactions.length > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.26 }} className="card-calm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">Últimos movimientos</h3>
              <button onClick={() => navigate('/transactions')} className="text-xs text-primary hover:underline">Ver todos</button>
            </div>
            <div className="space-y-2">
              {recentTransactions.map(tx => (
                <button key={tx.id} onClick={() => setEditTx(tx)} className="w-full flex items-center gap-3 hover:bg-accent/30 transition-colors rounded-lg p-2 -mx-2">
                  <span className="text-lg">{tx.categoryIcon}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-foreground truncate">{tx.merchant || tx.category}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)} · {tx.account}</p>
                  </div>
                  <span className={cn("text-sm font-semibold", tx.type === 'income' ? "text-success" : "text-foreground")}>
                    {tx.type === 'income' ? '+' : '–'}{formatMoney(tx.amount)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <QuickAddTransaction open={quickAddOpen} onOpenChange={setQuickAddOpen} />
      <TransactionEditor transaction={editTx} open={!!editTx} onOpenChange={() => setEditTx(null)} />
    </Layout>
  );
}
