import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Receivable {
  id: string;
  userId: string;
  debtorName: string;
  concept?: string;
  amountTotal: number;
  amountPaid: number;
  dueDate?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  reminderEnabled: boolean;
  lastReminderAt?: string;
  notes?: string;
}

const mapRow = (r: any): Receivable => ({
  id: r.id, userId: r.user_id, debtorName: r.debtor_name,
  concept: r.concept ?? undefined, amountTotal: Number(r.amount_total),
  amountPaid: Number(r.amount_paid), dueDate: r.due_date ?? undefined,
  status: r.status || 'pending', reminderEnabled: r.reminder_enabled,
  lastReminderAt: r.last_reminder_at ?? undefined, notes: r.notes ?? undefined,
});

export function useReceivables() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["receivables", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("receivables").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    enabled: !!user,
  });
}

export function useReceivableMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["receivables", user?.id];

  const add = useMutation({
    mutationFn: async (r: Omit<Receivable, "id" | "userId">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("receivables").insert({
        user_id: user.id, debtor_name: r.debtorName, concept: r.concept ?? null,
        amount_total: r.amountTotal, amount_paid: r.amountPaid, due_date: r.dueDate ?? null,
        status: r.status, reminder_enabled: r.reminderEnabled, notes: r.notes ?? null,
      } as any).select().single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...u }: Partial<Receivable> & { id: string }) => {
      const d: any = {};
      if (u.debtorName !== undefined) d.debtor_name = u.debtorName;
      if (u.concept !== undefined) d.concept = u.concept;
      if (u.amountTotal !== undefined) d.amount_total = u.amountTotal;
      if (u.amountPaid !== undefined) d.amount_paid = u.amountPaid;
      if (u.dueDate !== undefined) d.due_date = u.dueDate;
      if (u.status !== undefined) d.status = u.status;
      if (u.reminderEnabled !== undefined) d.reminder_enabled = u.reminderEnabled;
      if (u.notes !== undefined) d.notes = u.notes;
      const { error } = await supabase.from("receivables").update(d).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receivables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { add, update, remove };
}
