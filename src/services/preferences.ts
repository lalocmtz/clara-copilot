import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface UserFinancialPreferences {
  id: string;
  userId: string;
  monthlyIncomeGoal?: number;
  preferredCurrency: string;
  debtStrategyDefault: string;
  motivationalTone: 'calm' | 'direct' | 'ambitious';
  telegramDailyDigestEnabled: boolean;
  telegramDigestHour: number;
  weekStartDay: number;
}

const mapRow = (r: any): UserFinancialPreferences => ({
  id: r.id, userId: r.user_id,
  monthlyIncomeGoal: r.monthly_income_goal != null ? Number(r.monthly_income_goal) : undefined,
  preferredCurrency: r.preferred_currency, debtStrategyDefault: r.debt_strategy_default,
  motivationalTone: r.motivational_tone || 'calm',
  telegramDailyDigestEnabled: r.telegram_daily_digest_enabled,
  telegramDigestHour: r.telegram_digest_hour ?? 8,
  weekStartDay: r.week_start_day ?? 1,
});

export function useFinancialPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["financial_preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("user_financial_preferences").select("*")
        .eq("user_id", user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapRow(data) : null;
    },
    enabled: !!user,
  });
}

export function useFinancialPreferencesMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (prefs: Partial<Omit<UserFinancialPreferences, "id" | "userId">>) => {
      if (!user) throw new Error("Not authenticated");
      const d: any = { user_id: user.id };
      if (prefs.monthlyIncomeGoal !== undefined) d.monthly_income_goal = prefs.monthlyIncomeGoal;
      if (prefs.preferredCurrency !== undefined) d.preferred_currency = prefs.preferredCurrency;
      if (prefs.debtStrategyDefault !== undefined) d.debt_strategy_default = prefs.debtStrategyDefault;
      if (prefs.motivationalTone !== undefined) d.motivational_tone = prefs.motivationalTone;
      if (prefs.telegramDailyDigestEnabled !== undefined) d.telegram_daily_digest_enabled = prefs.telegramDailyDigestEnabled;
      if (prefs.telegramDigestHour !== undefined) d.telegram_digest_hour = prefs.telegramDigestHour;
      const { error } = await supabase.from("user_financial_preferences").upsert(d, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_preferences", user?.id] }),
  });

  return { upsert };
}
