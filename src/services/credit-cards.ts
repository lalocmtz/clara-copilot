import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface CreditCard {
  id: string;
  userId: string;
  bank: string;
  name: string;
  lastFour?: string;
  linkedAccountId?: string;
  creditLimit: number;
  currentBalance: number;
  statementBalance?: number;
  availableCredit?: number;
  closingDay?: number;
  dueDay?: number;
  minimumPayment?: number;
  noInterestPayment?: number;
  apr?: number;
  notes?: string;
  active: boolean;
}

const mapRow = (r: any): CreditCard => ({
  id: r.id,
  userId: r.user_id,
  bank: r.bank,
  name: r.name,
  lastFour: r.last_four ?? undefined,
  linkedAccountId: r.linked_account_id ?? undefined,
  creditLimit: Number(r.credit_limit),
  currentBalance: Number(r.current_balance),
  statementBalance: r.statement_balance != null ? Number(r.statement_balance) : undefined,
  availableCredit: r.available_credit != null ? Number(r.available_credit) : undefined,
  closingDay: r.closing_day ?? undefined,
  dueDay: r.due_day ?? undefined,
  minimumPayment: r.minimum_payment != null ? Number(r.minimum_payment) : undefined,
  noInterestPayment: r.no_interest_payment != null ? Number(r.no_interest_payment) : undefined,
  apr: r.apr != null ? Number(r.apr) : undefined,
  notes: r.notes ?? undefined,
  active: r.active,
});

export function useCreditCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["credit_cards", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    enabled: !!user,
  });
}

export function useCreditCardMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["credit_cards", user?.id];

  const add = useMutation({
    mutationFn: async (card: Omit<CreditCard, "id" | "userId">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("credit_cards").insert({
        user_id: user.id,
        bank: card.bank,
        name: card.name,
        last_four: card.lastFour ?? null,
        credit_limit: card.creditLimit,
        current_balance: card.currentBalance,
        statement_balance: card.statementBalance ?? null,
        available_credit: card.availableCredit ?? null,
        closing_day: card.closingDay ?? null,
        due_day: card.dueDay ?? null,
        minimum_payment: card.minimumPayment ?? null,
        no_interest_payment: card.noInterestPayment ?? null,
        apr: card.apr ?? null,
        notes: card.notes ?? null,
        active: card.active ?? true,
      } as any).select().single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreditCard> & { id: string }) => {
      const dbUpdates: any = {};
      if (updates.bank !== undefined) dbUpdates.bank = updates.bank;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.lastFour !== undefined) dbUpdates.last_four = updates.lastFour;
      if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;
      if (updates.currentBalance !== undefined) dbUpdates.current_balance = updates.currentBalance;
      if (updates.statementBalance !== undefined) dbUpdates.statement_balance = updates.statementBalance;
      if (updates.availableCredit !== undefined) dbUpdates.available_credit = updates.availableCredit;
      if (updates.closingDay !== undefined) dbUpdates.closing_day = updates.closingDay;
      if (updates.dueDay !== undefined) dbUpdates.due_day = updates.dueDay;
      if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment;
      if (updates.noInterestPayment !== undefined) dbUpdates.no_interest_payment = updates.noInterestPayment;
      if (updates.apr !== undefined) dbUpdates.apr = updates.apr;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.active !== undefined) dbUpdates.active = updates.active;
      const { error } = await supabase.from("credit_cards").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("credit_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { add, update, remove };
}

export function getUtilizationPct(card: CreditCard): number {
  if (card.creditLimit <= 0) return 0;
  return Math.round((Math.abs(card.currentBalance) / card.creditLimit) * 100);
}

export function getRiskLevel(card: CreditCard): 'low' | 'medium' | 'high' | 'critical' {
  const util = getUtilizationPct(card);
  if (util >= 80) return 'critical';
  if (util >= 60) return 'high';
  if (util >= 40) return 'medium';
  return 'low';
}

export interface CardRiskMetrics {
  utilization: number;
  daysToClosing: number | null;
  daysToDue: number | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  currentBalance: number;
  availableCredit: number;
  minimumPayment: number;
  noInterestPayment: number | null;
}

export function getCardRiskMetrics(card: CreditCard): CardRiskMetrics {
  const now = new Date();
  const currentDay = now.getDate();
  
  const daysTo = (targetDay: number | undefined): number | null => {
    if (!targetDay) return null;
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 30; // approximate
    return diff;
  };

  return {
    utilization: getUtilizationPct(card),
    daysToClosing: daysTo(card.closingDay),
    daysToDue: daysTo(card.dueDay),
    riskLevel: getRiskLevel(card),
    currentBalance: Math.abs(card.currentBalance),
    availableCredit: card.creditLimit - Math.abs(card.currentBalance),
    minimumPayment: card.minimumPayment || 0,
    noInterestPayment: card.noInterestPayment ?? null,
  };
}
