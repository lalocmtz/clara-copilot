import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type JarType = 'necessities' | 'financial_freedom' | 'education' | 'play' | 'long_term_savings' | 'give';

export const JAR_LABELS: Record<JarType, string> = {
  necessities: 'Necesidades',
  financial_freedom: 'Libertad financiera',
  education: 'Educación',
  play: 'Diversión',
  long_term_savings: 'Ahorro largo plazo',
  give: 'Dar',
};

export const JAR_ICONS: Record<JarType, string> = {
  necessities: '🏠',
  financial_freedom: '💎',
  education: '📚',
  play: '🎮',
  long_term_savings: '🏦',
  give: '💝',
};

export interface JarSettings {
  id: string;
  userId: string;
  necessities: number;
  financialFreedom: number;
  education: number;
  play: number;
  longTermSavings: number;
  give: number;
  effectiveFrom: string;
}

export interface IncomeAllocation {
  id: string;
  userId: string;
  incomeTransactionId: string;
  jarType: JarType;
  percentage: number;
  amount: number;
}

const mapJar = (r: any): JarSettings => ({
  id: r.id, userId: r.user_id,
  necessities: Number(r.necessities), financialFreedom: Number(r.financial_freedom),
  education: Number(r.education), play: Number(r.play),
  longTermSavings: Number(r.long_term_savings), give: Number(r.give),
  effectiveFrom: r.effective_from,
});

const mapAlloc = (r: any): IncomeAllocation => ({
  id: r.id, userId: r.user_id, incomeTransactionId: r.income_transaction_id,
  jarType: r.jar_type, percentage: Number(r.percentage), amount: Number(r.amount),
});

export function useJarSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["jar_settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("jar_settings").select("*")
        .eq("user_id", user.id).order("effective_from", { ascending: false }).limit(1);
      if (error) throw error;
      return data?.[0] ? mapJar(data[0]) : null;
    },
    enabled: !!user,
  });
}

export function useJarSettingsMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (settings: Omit<JarSettings, "id" | "userId">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("jar_settings").insert({
        user_id: user.id, necessities: settings.necessities,
        financial_freedom: settings.financialFreedom, education: settings.education,
        play: settings.play, long_term_savings: settings.longTermSavings,
        give: settings.give, effective_from: settings.effectiveFrom,
      } as any).select().single();
      if (error) throw error;
      return mapJar(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jar_settings", user?.id] }),
  });

  return { upsert };
}

export function useIncomeAllocations(period?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["income_allocations", user?.id, period],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("income_allocations").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapAlloc);
    },
    enabled: !!user,
  });
}

export function distributeIncome(amount: number, settings: JarSettings): Record<JarType, number> {
  return {
    necessities: Math.round(amount * settings.necessities / 100),
    financial_freedom: Math.round(amount * settings.financialFreedom / 100),
    education: Math.round(amount * settings.education / 100),
    play: Math.round(amount * settings.play / 100),
    long_term_savings: Math.round(amount * settings.longTermSavings / 100),
    give: Math.round(amount * settings.give / 100),
  };
}
