import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCreditCards, type CreditCard } from "@/services/credit-cards";

export interface Debt {
  id: string;
  userId: string;
  name: string;
  creditor?: string;
  originalAmount: number;
  currentBalance: number;
  apr: number;
  minimumPayment: number;
  dueDay?: number;
  type: string;
  strategyTag: 'avalanche' | 'snowball' | 'manual';
  payoffPriority?: number;
  notes?: string;
  active: boolean;
}

/** Unified obligation for strategy engine — combines credit cards + debts */
export interface DebtObligation {
  obligationId: string;
  source: 'credit_card' | 'debt';
  name: string;
  creditor?: string;
  currentBalance: number;
  apr: number;
  minimumPayment: number;
  dueDay?: number;
  utilization?: number;
  noInterestPayment?: number;
  payoffPriority?: number;
  active: boolean;
}

const mapRow = (r: any): Debt => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  creditor: r.creditor ?? undefined,
  originalAmount: Number(r.original_amount),
  currentBalance: Number(r.current_balance),
  apr: Number(r.apr || 0),
  minimumPayment: Number(r.minimum_payment || 0),
  dueDay: r.due_day ?? undefined,
  type: r.type,
  strategyTag: r.strategy_tag || 'manual',
  payoffPriority: r.payoff_priority ?? undefined,
  notes: r.notes ?? undefined,
  active: r.active,
});

export function useDebts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("debts").select("*").eq("user_id", user.id).order("created_at");
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    enabled: !!user,
  });
}

export function useDebtMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["debts", user?.id];

  const add = useMutation({
    mutationFn: async (debt: Omit<Debt, "id" | "userId">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("debts").insert({
        user_id: user.id, name: debt.name, creditor: debt.creditor ?? null,
        original_amount: debt.originalAmount, current_balance: debt.currentBalance,
        apr: debt.apr, minimum_payment: debt.minimumPayment, due_day: debt.dueDay ?? null,
        type: debt.type, strategy_tag: debt.strategyTag, payoff_priority: debt.payoffPriority ?? null,
        notes: debt.notes ?? null, active: debt.active ?? true,
      } as any).select().single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...u }: Partial<Debt> & { id: string }) => {
      const d: any = {};
      if (u.name !== undefined) d.name = u.name;
      if (u.creditor !== undefined) d.creditor = u.creditor;
      if (u.originalAmount !== undefined) d.original_amount = u.originalAmount;
      if (u.currentBalance !== undefined) d.current_balance = u.currentBalance;
      if (u.apr !== undefined) d.apr = u.apr;
      if (u.minimumPayment !== undefined) d.minimum_payment = u.minimumPayment;
      if (u.dueDay !== undefined) d.due_day = u.dueDay;
      if (u.type !== undefined) d.type = u.type;
      if (u.strategyTag !== undefined) d.strategy_tag = u.strategyTag;
      if (u.payoffPriority !== undefined) d.payoff_priority = u.payoffPriority;
      if (u.notes !== undefined) d.notes = u.notes;
      if (u.active !== undefined) d.active = u.active;
      const { error } = await supabase.from("debts").update(d).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { add, update, remove };
}

/** Combines credit cards + debts into a unified list for strategy */
export function useUnifiedObligations(): { data: DebtObligation[]; isLoading: boolean } {
  const { data: debts = [], isLoading: debtsLoading } = useDebts();
  const { data: creditCards = [], isLoading: cardsLoading } = useCreditCards();

  const data: DebtObligation[] = [
    ...creditCards
      .filter(c => c.active && Math.abs(c.currentBalance) > 0)
      .map((c): DebtObligation => ({
        obligationId: c.id,
        source: 'credit_card',
        name: c.name,
        creditor: c.bank,
        currentBalance: Math.abs(c.currentBalance),
        apr: c.apr || 0,
        minimumPayment: c.minimumPayment || 0,
        dueDay: c.dueDay,
        utilization: c.creditLimit > 0 ? Math.round((Math.abs(c.currentBalance) / c.creditLimit) * 100) : 0,
        noInterestPayment: c.noInterestPayment,
        active: c.active,
      })),
    ...debts
      .filter(d => d.active && d.currentBalance > 0)
      .map((d): DebtObligation => ({
        obligationId: d.id,
        source: 'debt',
        name: d.name,
        creditor: d.creditor,
        currentBalance: d.currentBalance,
        apr: d.apr,
        minimumPayment: d.minimumPayment,
        dueDay: d.dueDay,
        payoffPriority: d.payoffPriority,
        active: d.active,
      })),
  ];

  return { data, isLoading: debtsLoading || cardsLoading };
}

// Snowball: order by balance ascending
export function snowballOrder(obligations: DebtObligation[]): DebtObligation[] {
  return [...obligations].filter(d => d.active && d.currentBalance > 0).sort((a, b) => a.currentBalance - b.currentBalance);
}

// Avalanche: order by APR descending
export function avalancheOrder(obligations: DebtObligation[]): DebtObligation[] {
  return [...obligations].filter(d => d.active && d.currentBalance > 0).sort((a, b) => b.apr - a.apr);
}

export function calculatePayoff(balance: number, apr: number, monthlyPayment: number): { months: number; totalInterest: number } {
  if (monthlyPayment <= 0 || balance <= 0) return { months: 0, totalInterest: 0 };
  const monthlyRate = apr / 100 / 12;
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  while (bal > 0 && months < 600) {
    const interest = bal * monthlyRate;
    totalInterest += interest;
    bal = bal + interest - monthlyPayment;
    months++;
    if (monthlyPayment <= interest) return { months: Infinity, totalInterest: Infinity };
  }
  return { months, totalInterest: Math.round(totalInterest) };
}
