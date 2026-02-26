import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode, } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
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
  type: 'expense' | 'income';
}

interface AppContextType {
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  subscriptions: Subscription[];
  investments: Investment[];
  categories: Category[];
  loading: boolean;

  addTransaction: (t: Omit<Transaction, "id">, options?: { skipBalanceUpdate?: boolean }) => void;
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

  addInvestment: (i: Omit<Investment, "id">) => void;
  updateInvestment: (id: string, i: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  addCategory: (c: Omit<Category, "id" | "active">) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  toggleCategory: (id: string) => void;
  deleteCategory: (id: string) => void;

  resetAll: () => void;
  refetchData: () => void;

  monthlyTotals: { income: number; expenses: number };
  topCategories: { name: string; icon: string; amount: number; percentage: number }[];
}

const AppContext = createContext<AppContextType | null>(null);

function calcNextDate(billingDay: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  if (today < billingDay) {
    return new Date(y, m, billingDay).toISOString().slice(0, 10);
  }
  return new Date(y, m + 1, billingDay).toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]); setAccounts([]); setBudgets([]);
      setSubscriptions([]); setInvestments([]); setCategories([]);
      setLoading(false);
      return;
    }
    loadAllData();
  }, [user]);

  async function loadAllData() {
    if (!user) return;
    setLoading(true);

    // Check if demo was already seeded
    const { data: profile } = await supabase
      .from("profiles")
      .select("demo_seeded")
      .eq("user_id", user.id)
      .single();

    const [txRes, accRes, budRes, subRes, invRes, catRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("accounts").select("*").eq("user_id", user.id),
      supabase.from("budgets").select("*").eq("user_id", user.id),
      supabase.from("subscriptions").select("*").eq("user_id", user.id),
      supabase.from("investments").select("*").eq("user_id", user.id),
      supabase.from("categories").select("*").eq("user_id", user.id).order("sort_order"),
    ]);

    const mapTx = (r: any): Transaction => ({
      id: r.id, type: r.type, amount: Number(r.amount), currency: r.currency,
      date: r.date, category: r.category, categoryIcon: r.category_icon,
      account: r.account, notes: r.notes, merchant: r.merchant,
      toAccount: r.to_account ?? undefined,
      status: r.status ?? 'confirmed',
    });
    const mapAcc = (r: any): Account => ({
      id: r.id, name: r.name, type: r.type, balance: Number(r.balance), currency: r.currency,
      creditLimit: r.credit_limit ? Number(r.credit_limit) : undefined,
      cutoffDate: r.cutoff_date ?? undefined, paymentDate: r.payment_date ?? undefined,
      balanceUpdatedAt: r.balance_updated_at ?? undefined,
    });
    const mapBudget = (r: any): Budget => ({
      id: r.id, category: r.category, categoryIcon: r.category_icon,
      budgeted: Number(r.budgeted), spent: Number(r.spent), period: r.period,
    });
    const mapSub = (r: any): Subscription => ({
      id: r.id, name: r.name, amount: Number(r.amount),
      frequency: r.frequency as Subscription['frequency'], nextDate: r.next_date, paid: r.paid,
      billingDay: r.billing_day ?? undefined,
      subType: (r.sub_type || 'digital') as Subscription['subType'],
      category: r.category ?? undefined,
      categoryIcon: r.category_icon ?? undefined,
    });
    const mapInv = (r: any): Investment => ({
      id: r.id, name: r.name, type: r.type, current_value: Number(r.current_value),
      cost_basis: Number(r.cost_basis), last_updated: r.last_updated,
    });
    const mapCat = (r: any): Category => ({
      id: r.id, name: r.name, icon: r.icon, active: r.active, type: r.type || 'expense',
    });

    const txData = (txRes.data || []).map(mapTx);
    const accData = (accRes.data || []).map(mapAcc);
    const budData = (budRes.data || []).map(mapBudget);
    const subData = (subRes.data || []).map(mapSub);
    const invData = (invRes.data || []).map(mapInv);
    const catData = (catRes.data || []).map(mapCat);

    // Only seed if demo_seeded is false (first time user)
    const demoSeeded = profile?.demo_seeded ?? false;
    if (!demoSeeded && txData.length === 0 && accData.length === 0 && catData.length === 0) {
      await seedDemoData();
      // Mark as seeded
      await supabase.from("profiles").update({ demo_seeded: true } as any).eq("user_id", user.id);
      await loadAllData();
      return;
    }

    // Recalculate spent dynamically from transactions
    const budDataWithSpent = budData.map(b => {
      const realSpent = txData
        .filter(t => t.type === 'expense' && t.date.startsWith(b.period) && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, spent: realSpent };
    });

    setTransactions(txData);
    setAccounts(accData);
    setBudgets(budDataWithSpent);
    setSubscriptions(subData);
    setInvestments(invData);
    setCategories(catData);
    setLoading(false);
  }

  async function seedDemoData() {
    if (!user) return;
    const uid = user.id;

    const catInserts = defaultCategories.map((c, i) => ({
      user_id: uid, name: c.name, icon: c.icon, active: true, sort_order: i, type: c.type || 'expense',
    }));
    await supabase.from("categories").insert(catInserts);

    const accInserts = defaultAccounts.map(a => ({
      user_id: uid, name: a.name, type: a.type, balance: a.balance, currency: a.currency,
      credit_limit: a.creditLimit ?? null, cutoff_date: a.cutoffDate ?? null, payment_date: a.paymentDate ?? null,
    }));
    await supabase.from("accounts").insert(accInserts);

    const txInserts = defaultTransactions.map(t => ({
      user_id: uid, type: t.type, amount: t.amount, currency: t.currency, date: t.date,
      category: t.category, category_icon: t.categoryIcon, account: t.account,
      notes: t.notes ?? null, merchant: t.merchant ?? null,
    }));
    await supabase.from("transactions").insert(txInserts);

    const budInserts = defaultBudgets.map(b => ({
      user_id: uid, category: b.category, category_icon: b.categoryIcon,
      budgeted: b.budgeted, spent: 0, period: b.period,
    }));
    await supabase.from("budgets").insert(budInserts);

    const subInserts = defaultSubscriptions.map(s => ({
      user_id: uid, name: s.name, amount: s.amount, frequency: s.frequency,
      next_date: s.nextDate, paid: s.paid,
      billing_day: s.billingDay ?? null, sub_type: s.subType ?? 'digital',
      category: s.category ?? null, category_icon: s.categoryIcon ?? '🔄',
    }));
    await supabase.from("subscriptions").insert(subInserts);

    const invInserts = defaultInvestments.map(i => ({
      user_id: uid, name: i.name, type: i.type, current_value: i.current_value,
      cost_basis: i.cost_basis, last_updated: i.last_updated,
    }));
    await supabase.from("investments").insert(invInserts);
  }

  // === CRUD ===

  const updateAccountBalance = useCallback(async (accountName: string, delta: number) => {
    const acc = accounts.find(a => a.name === accountName);
    if (!acc) return;
    const newBalance = acc.balance + delta;
    await supabase.from("accounts").update({ balance: newBalance }).eq("id", acc.id);
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, balance: newBalance } : a));
  }, [accounts]);

  const addTransaction = useCallback(async (t: Omit<Transaction, "id">, options?: { skipBalanceUpdate?: boolean }) => {
    if (!user) return;
    const insertData: any = {
      user_id: user.id, type: t.type, amount: t.amount, currency: t.currency, date: t.date,
      category: t.category, category_icon: t.categoryIcon, account: t.account,
      notes: t.notes ?? null, merchant: t.merchant ?? null,
      status: t.status ?? 'confirmed',
    };
    if (t.type === 'transfer' && t.toAccount) insertData.to_account = t.toAccount;
    const { data, error } = await supabase.from("transactions").insert(insertData).select().single();
    if (data && !error) {
      setTransactions(prev => [{
        id: data.id, type: data.type as Transaction['type'], amount: Number(data.amount), currency: data.currency,
        date: data.date, category: data.category, categoryIcon: data.category_icon,
        account: data.account, notes: data.notes ?? undefined, merchant: data.merchant ?? undefined,
        toAccount: (data as any).to_account ?? undefined,
        status: (data as any).status ?? 'confirmed',
      }, ...prev]);
      if (!options?.skipBalanceUpdate) {
        if (t.type === 'transfer' && t.toAccount) {
          await updateAccountBalance(t.account, -t.amount);
          await updateAccountBalance(t.toAccount, t.amount);
        } else {
          const delta = t.type === 'income' ? t.amount : -t.amount;
          await updateAccountBalance(t.account, delta);
        }
      }
    }
  }, [user, updateAccountBalance]);

  const updateTransaction = useCallback(async (id: string, t: Partial<Transaction>) => {
    const oldTx = transactions.find(tx => tx.id === id);
    if (oldTx) {
      // Revert old impact
      if (oldTx.type === 'transfer' && oldTx.toAccount) {
        await updateAccountBalance(oldTx.account, oldTx.amount); // give back to origin
        await updateAccountBalance(oldTx.toAccount, -oldTx.amount); // take back from dest
      } else {
        const oldDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
        await updateAccountBalance(oldTx.account, oldDelta);
      }

      // Apply new impact
      const newType = t.type ?? oldTx.type;
      const newAmount = t.amount ?? oldTx.amount;
      const newAccount = t.account ?? oldTx.account;
      const newToAccount = t.toAccount ?? oldTx.toAccount;

      if (newType === 'transfer' && newToAccount) {
        await updateAccountBalance(newAccount, -newAmount);
        await updateAccountBalance(newToAccount, newAmount);
      } else {
        const newDelta = newType === 'income' ? newAmount : -newAmount;
        await updateAccountBalance(newAccount, newDelta);
      }
    }

    const updates: any = {};
    if (t.type !== undefined) updates.type = t.type;
    if (t.amount !== undefined) updates.amount = t.amount;
    if (t.category !== undefined) updates.category = t.category;
    if (t.categoryIcon !== undefined) updates.category_icon = t.categoryIcon;
    if (t.account !== undefined) updates.account = t.account;
    if (t.notes !== undefined) updates.notes = t.notes;
    if (t.merchant !== undefined) updates.merchant = t.merchant;
    if (t.toAccount !== undefined) updates.to_account = t.toAccount;
    if (t.status !== undefined) updates.status = t.status;
    await supabase.from("transactions").update(updates).eq("id", id);
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...t } : tx));
  }, [transactions, updateAccountBalance]);

  const deleteTransaction = useCallback(async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
      if (tx.type === 'transfer' && tx.toAccount) {
        await updateAccountBalance(tx.account, tx.amount); // give back to origin
        await updateAccountBalance(tx.toAccount, -tx.amount); // take back from dest
      } else {
        const revertDelta = tx.type === 'income' ? -tx.amount : tx.amount;
        await updateAccountBalance(tx.account, revertDelta);
      }
    }
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [transactions, updateAccountBalance]);

  const addAccount = useCallback(async (a: Omit<Account, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("accounts").insert({
      user_id: user.id, name: a.name, type: a.type, balance: a.balance, currency: a.currency,
      credit_limit: a.creditLimit ?? null, cutoff_date: a.cutoffDate ?? null, payment_date: a.paymentDate ?? null,
    }).select().single();
    if (data) {
      setAccounts(prev => [...prev, {
        id: data.id, name: data.name, type: data.type as Account['type'], balance: Number(data.balance),
        currency: data.currency, creditLimit: data.credit_limit ? Number(data.credit_limit) : undefined,
        cutoffDate: data.cutoff_date ?? undefined, paymentDate: data.payment_date ?? undefined,
      }]);
    }
  }, [user]);

  const updateAccount = useCallback(async (id: string, a: Partial<Account>) => {
    const updates: any = {};
    if (a.name !== undefined) updates.name = a.name;
    if (a.type !== undefined) updates.type = a.type;
    if (a.balance !== undefined) {
      updates.balance = a.balance;
      updates.balance_updated_at = new Date().toISOString();
    }
    if (a.creditLimit !== undefined) updates.credit_limit = a.creditLimit;
    if (a.cutoffDate !== undefined) updates.cutoff_date = a.cutoffDate;
    if (a.paymentDate !== undefined) updates.payment_date = a.paymentDate;
    await supabase.from("accounts").update(updates).eq("id", id);
    const balanceUpdatedAt = updates.balance_updated_at || undefined;
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...a, ...(balanceUpdatedAt ? { balanceUpdatedAt } : {}) } : acc));
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    await supabase.from("accounts").delete().eq("id", id);
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  }, []);

  const updateBudget = useCallback(async (id: string, b: Partial<Budget>) => {
    const updates: any = {};
    if (b.budgeted !== undefined) updates.budgeted = b.budgeted;
    if (b.spent !== undefined) updates.spent = b.spent;
    await supabase.from("budgets").update(updates).eq("id", id);
    setBudgets(prev => prev.map(bgt => bgt.id === id ? { ...bgt, ...b } : bgt));
  }, []);

  const addBudget = useCallback(async (b: Omit<Budget, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("budgets").insert({
      user_id: user.id, category: b.category, category_icon: b.categoryIcon,
      budgeted: b.budgeted, spent: b.spent, period: b.period,
    }).select().single();
    if (data) {
      setBudgets(prev => [...prev, {
        id: data.id, category: data.category, categoryIcon: data.category_icon,
        budgeted: Number(data.budgeted), spent: Number(data.spent), period: data.period,
      }]);
    }
  }, [user]);

  const deleteBudget = useCallback(async (id: string) => {
    await supabase.from("budgets").delete().eq("id", id);
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  const addSubscription = useCallback(async (s: Omit<Subscription, "id">) => {
    if (!user) return;
    const nextDate = s.billingDay ? calcNextDate(s.billingDay) : s.nextDate;
    const { data } = await supabase.from("subscriptions").insert({
      user_id: user.id, name: s.name, amount: s.amount, frequency: s.frequency,
      next_date: nextDate, paid: s.paid,
      billing_day: s.billingDay ?? null, sub_type: s.subType ?? 'digital',
      category: s.category ?? null, category_icon: s.categoryIcon ?? '🔄',
    }).select().single();
    if (data) {
      setSubscriptions(prev => [...prev, {
        id: data.id, name: data.name, amount: Number(data.amount),
        frequency: data.frequency as Subscription['frequency'], nextDate: data.next_date, paid: data.paid,
        billingDay: data.billing_day ?? undefined, subType: (data.sub_type || 'digital') as Subscription['subType'],
        category: data.category ?? undefined, categoryIcon: data.category_icon ?? undefined,
      }]);
    }
  }, [user]);

  const updateSubscription = useCallback(async (id: string, s: Partial<Subscription>) => {
    const updates: any = {};
    if (s.name !== undefined) updates.name = s.name;
    if (s.amount !== undefined) updates.amount = s.amount;
    if (s.frequency !== undefined) updates.frequency = s.frequency;
    if (s.paid !== undefined) updates.paid = s.paid;
    if (s.billingDay !== undefined) {
      updates.billing_day = s.billingDay;
      updates.next_date = calcNextDate(s.billingDay);
    }
    if (s.nextDate !== undefined && !s.billingDay) updates.next_date = s.nextDate;
    if (s.subType !== undefined) updates.sub_type = s.subType;
    if (s.category !== undefined) updates.category = s.category;
    if (s.categoryIcon !== undefined) updates.category_icon = s.categoryIcon;
    await supabase.from("subscriptions").update(updates).eq("id", id);
    setSubscriptions(prev => prev.map(sub => sub.id === id ? { ...sub, ...s } : sub));
  }, []);

  const deleteSubscription = useCallback(async (id: string) => {
    await supabase.from("subscriptions").delete().eq("id", id);
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  }, []);

  const addInvestment = useCallback(async (i: Omit<Investment, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("investments").insert({
      user_id: user.id, name: i.name, type: i.type,
      current_value: i.current_value, cost_basis: i.cost_basis, last_updated: i.last_updated,
    }).select().single();
    if (data) {
      setInvestments(prev => [...prev, {
        id: data.id, name: data.name, type: data.type as Investment['type'],
        current_value: Number(data.current_value), cost_basis: Number(data.cost_basis),
        last_updated: data.last_updated,
      }]);
    }
  }, [user]);

  const updateInvestment = useCallback(async (id: string, i: Partial<Investment>) => {
    const updates: any = {};
    if (i.current_value !== undefined) updates.current_value = i.current_value;
    if (i.cost_basis !== undefined) updates.cost_basis = i.cost_basis;
    if (i.name !== undefined) updates.name = i.name;
    if (i.type !== undefined) updates.type = i.type;
    if (i.last_updated !== undefined) updates.last_updated = i.last_updated;
    await supabase.from("investments").update(updates).eq("id", id);
    setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, ...i } : inv));
  }, []);

  const deleteInvestment = useCallback(async (id: string) => {
    await supabase.from("investments").delete().eq("id", id);
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const addCategory = useCallback(async (c: Omit<Category, "id" | "active">) => {
    if (!user) return;
    const { data } = await supabase.from("categories").insert({
      user_id: user.id, name: c.name, icon: c.icon, active: true, type: c.type || 'expense',
    }).select().single();
    if (data) {
      setCategories(prev => [...prev, { id: data.id, name: data.name, icon: data.icon, active: data.active, type: (data as any).type || 'expense' }]);
    }
  }, [user]);

  const updateCategory = useCallback(async (id: string, c: Partial<Category>) => {
    const updates: any = {};
    if (c.name !== undefined) updates.name = c.name;
    if (c.icon !== undefined) updates.icon = c.icon;
    if (c.active !== undefined) updates.active = c.active;
    await supabase.from("categories").update(updates).eq("id", id);
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...c } : cat));
  }, []);

  const toggleCategory = useCallback(async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    const newActive = !cat.active;
    await supabase.from("categories").update({ active: newActive }).eq("id", id);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: newActive } : c));
  }, [categories]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;
    // Delete associated budgets for this category
    const cat = categories.find(c => c.id === id);
    if (cat) {
      await supabase.from("budgets").delete().eq("user_id", user.id).eq("category", cat.name);
      setBudgets(prev => prev.filter(b => b.category !== cat.name));
    }
    await supabase.from("categories").delete().eq("id", id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, [user, categories]);

  const refetchData = useCallback(() => {
    loadAllData();
  }, [user]);

  const resetAll = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      supabase.from("transactions").delete().eq("user_id", user.id),
      supabase.from("accounts").delete().eq("user_id", user.id),
      supabase.from("budgets").delete().eq("user_id", user.id),
      supabase.from("subscriptions").delete().eq("user_id", user.id),
      supabase.from("investments").delete().eq("user_id", user.id),
      supabase.from("categories").delete().eq("user_id", user.id),
    ]);
    // Reset demo_seeded so re-seeding happens
    await supabase.from("profiles").update({ demo_seeded: false } as any).eq("user_id", user.id);
    await seedDemoData();
    await supabase.from("profiles").update({ demo_seeded: true } as any).eq("user_id", user.id);
    await loadAllData();
  }, [user]);

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
    transactions, accounts, budgets, subscriptions, investments, categories, loading,
    addTransaction, updateTransaction, deleteTransaction,
    addAccount, updateAccount, deleteAccount,
    updateBudget, addBudget, deleteBudget,
    addSubscription, updateSubscription, deleteSubscription,
    addInvestment, updateInvestment, deleteInvestment,
    addCategory, updateCategory, toggleCategory, deleteCategory,
    resetAll, refetchData,
    monthlyTotals, topCategories,
  }), [transactions, accounts, budgets, subscriptions, investments, categories, loading,
    monthlyTotals, topCategories, addTransaction, updateTransaction, deleteTransaction,
    addAccount, updateAccount, deleteAccount, updateBudget, addBudget, deleteBudget,
    addSubscription, updateSubscription, deleteSubscription,
    addInvestment, updateInvestment, deleteInvestment,
    addCategory, updateCategory, toggleCategory, deleteCategory, resetAll, refetchData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used within AppProvider");
  return ctx;
}
