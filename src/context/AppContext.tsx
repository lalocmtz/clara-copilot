import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import {
  transactions as defaultTransactions,
  accounts as defaultAccounts,
  budgets as defaultBudgets,
  subscriptions as defaultSubscriptions,
  investments as defaultInvestments,
  categories as defaultCategories,
  Transaction, Account, Budget, Subscription, Investment,
} from "@/lib/mock-data";

interface Category {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

interface AppContextType {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  subscriptions: Subscription[];
  investments: Investment[];
  categories: Category[];

  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addAccount: (a: Omit<Account, "id">) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  updateBudget: (id: string, b: Partial<Budget>) => void;
  addBudget: (b: Omit<Budget, "id">) => void;
  deleteBudget: (id: string) => void;

  addSubscription: (s: Omit<Subscription, "id">) => void;
  updateSubscription: (id: string, s: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;

  updateInvestment: (id: string, i: Partial<Investment>) => void;

  addCategory: (c: Omit<Category, "id" | "active">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  toggleCategory: (id: string) => void;

  resetAll: () => void;

  // Computed
  monthlyTotals: { income: number; expenses: number };
  topCategories: { name: string; icon: string; amount: number; percentage: number }[];
}

const AppContext = createContext<AppContextType | null>(null);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const initCategories: Category[] = defaultCategories.map(c => ({ ...c, active: true }));

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([...defaultTransactions]);
  const [accounts, setAccounts] = useState<Account[]>([...defaultAccounts]);
  const [budgets, setBudgets] = useState<Budget[]>([...defaultBudgets]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([...defaultSubscriptions]);
  const [investments, setInvestments] = useState<Investment[]>([...defaultInvestments]);
  const [categories, setCategories] = useState<Category[]>([...initCategories]);

  // Transactions
  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    setTransactions(prev => [{ ...t, id: genId() }, ...prev]);
  }, []);
  const updateTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...t } : tx));
  }, []);
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }, []);

  // Accounts
  const addAccount = useCallback((a: Omit<Account, "id">) => {
    setAccounts(prev => [...prev, { ...a, id: genId() }]);
  }, []);
  const updateAccount = useCallback((id: string, a: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...a } : acc));
  }, []);
  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }, []);

  // Budgets
  const updateBudget = useCallback((id: string, b: Partial<Budget>) => {
    setBudgets(prev => prev.map(bgt => bgt.id === id ? { ...bgt, ...b } : bgt));
  }, []);
  const addBudget = useCallback((b: Omit<Budget, "id">) => {
    setBudgets(prev => [...prev, { ...b, id: genId() }]);
  }, []);
  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  // Subscriptions
  const addSubscription = useCallback((s: Omit<Subscription, "id">) => {
    setSubscriptions(prev => [...prev, { ...s, id: genId() }]);
  }, []);
  const updateSubscription = useCallback((id: string, s: Partial<Subscription>) => {
    setSubscriptions(prev => prev.map(sub => sub.id === id ? { ...sub, ...s } : sub));
  }, []);
  const deleteSubscription = useCallback((id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  }, []);

  // Investments
  const updateInvestment = useCallback((id: string, i: Partial<Investment>) => {
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, ...i } : inv));
  }, []);

  // Categories
  const addCategory = useCallback((c: Omit<Category, "id" | "active">) => {
    setCategories(prev => [...prev, { ...c, id: genId(), active: true }]);
  }, []);
  const updateCategory = useCallback((id: string, c: Partial<Category>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...c } : cat));
  }, []);
  const toggleCategory = useCallback((id: string) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, active: !cat.active } : cat));
  }, []);

  // Reset
  const resetAll = useCallback(() => {
    setTransactions([...defaultTransactions]);
    setAccounts([...defaultAccounts]);
    setBudgets([...defaultBudgets]);
    setSubscriptions([...defaultSubscriptions]);
    setInvestments([...defaultInvestments]);
    setCategories([...initCategories]);
  }, []);

  // Computed
  const monthlyTotals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses };
  }, [transactions]);

  const topCategories = useMemo(() => {
    const expenseTx = transactions.filter(t => t.type === 'expense');
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
  }, [transactions]);

  const value = useMemo(() => ({
    transactions, accounts, budgets, subscriptions, investments, categories,
    addTransaction, updateTransaction, deleteTransaction,
    addAccount, updateAccount, deleteAccount,
    updateBudget, addBudget, deleteBudget,
    addSubscription, updateSubscription, deleteSubscription,
    updateInvestment,
    addCategory, updateCategory, toggleCategory,
    resetAll,
    monthlyTotals, topCategories,
  }), [transactions, accounts, budgets, subscriptions, investments, categories, monthlyTotals, topCategories,
    addTransaction, updateTransaction, deleteTransaction, addAccount, updateAccount, deleteAccount,
    updateBudget, addBudget, deleteBudget, addSubscription, updateSubscription, deleteSubscription,
    updateInvestment, addCategory, updateCategory, toggleCategory, resetAll]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used within AppProvider");
  return ctx;
}
