import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useAppData } from "@/context/AppContext";
import { useJarSettings, useJarSettingsMutations, useIncomeAllocations, distributeIncome, JAR_LABELS, JAR_ICONS, type JarType } from "@/services/allocations";
import { useFinancialPreferences, useFinancialPreferencesMutations } from "@/services/preferences";
import { cn } from "@/lib/utils";
import { TrendingUp, Settings, Target } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const jarOrder: JarType[] = ['necessities', 'financial_freedom', 'education', 'play', 'long_term_savings', 'give'];

const jarColors: Record<JarType, string> = {
  necessities: 'bg-primary',
  financial_freedom: 'bg-warning',
  education: 'bg-[hsl(210,60%,55%)]',
  play: 'bg-[hsl(340,55%,55%)]',
  long_term_savings: 'bg-success',
  give: 'bg-[hsl(280,55%,55%)]',
};

export default function Income() {
  const { transactions } = useAppData();
  const { data: jarSettings } = useJarSettings();
  const { data: prefs } = useFinancialPreferences();
  const { upsert: upsertJar } = useJarSettingsMutations();
  const { upsert: upsertPrefs } = useFinancialPreferencesMutations();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const monthIncomes = useMemo(() =>
    transactions.filter(t => t.type === 'income' && t.date.startsWith(currentPeriod)),
    [transactions, currentPeriod]
  );
  const totalIncome = monthIncomes.reduce((s, t) => s + t.amount, 0);
  const goal = prefs?.monthlyIncomeGoal || 0;
  const goalPct = goal > 0 ? Math.round((totalIncome / goal) * 100) : 0;

  const defaultSettings = {
    necessities: 55, financialFreedom: 10, education: 10,
    play: 10, longTermSavings: 10, give: 5, effectiveFrom: new Date().toISOString().slice(0, 10),
  };
  const settings = jarSettings || { ...defaultSettings, id: '', userId: '' };
  const distribution = distributeIncome(totalIncome, settings as any);

  const [jarForm, setJarForm] = useState(defaultSettings);
  const [goalForm, setGoalForm] = useState(goal.toString());

  const handleSaveSettings = async () => {
    const total = jarForm.necessities + jarForm.financialFreedom + jarForm.education + jarForm.play + jarForm.longTermSavings + jarForm.give;
    if (total !== 100) return;
    await upsertJar.mutateAsync(jarForm);
    if (goalForm) await upsertPrefs.mutateAsync({ monthlyIncomeGoal: parseFloat(goalForm) || undefined });
    setSettingsOpen(false);
  };

  const monthName = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Ingresos</h2>
            <p className="text-muted-foreground text-sm mt-1 capitalize">{monthName}</p>
          </div>
          <button onClick={() => { setJarForm({ necessities: settings.necessities, financialFreedom: settings.financialFreedom, education: settings.education, play: settings.play, longTermSavings: settings.longTermSavings, give: settings.give, effectiveFrom: new Date().toISOString().slice(0, 10) }); setGoalForm(goal.toString()); setSettingsOpen(true); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" /> Configurar
          </button>
        </motion.div>

        {/* Income total + goal */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="card-calm p-6">
          <p className="text-label mb-1">Ingresos del mes</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">{formatMoney(totalIncome)}</p>
          {goal > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Meta: {formatMoney(goal)}</span>
                <span>{goalPct}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", goalPct >= 100 ? "bg-success" : goalPct >= 70 ? "bg-primary" : "bg-warning")} style={{ width: `${Math.min(goalPct, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {goalPct >= 100 ? '🎉 ¡Meta alcanzada!' : goalPct >= 70 ? '💪 Vas por buen camino' : 'Sigue adelante'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Jar distribution */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-medium text-foreground mb-3">Distribución por frascos (T. Harv Eker)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {jarOrder.map((jar, i) => {
              const pct = (settings as any)[jar === 'financial_freedom' ? 'financialFreedom' : jar === 'long_term_savings' ? 'longTermSavings' : jar] || 0;
              return (
                <motion.div key={jar} {...fadeIn} transition={{ delay: 0.15 + i * 0.03 }} className="card-calm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{JAR_ICONS[jar]}</span>
                    <span className="text-xs font-medium text-foreground">{JAR_LABELS[jar]}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{formatMoney(distribution[jar])}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", jarColors[jar])} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent incomes */}
        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="card-calm p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Ingresos recientes</h3>
          {monthIncomes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ingresos registrados este mes.</p>
          ) : (
            <div className="space-y-3">
              {monthIncomes.slice(0, 10).map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{tx.categoryIcon}</span>
                    <div>
                      <p className="text-sm text-foreground">{tx.merchant || tx.notes || tx.category}</p>
                      <p className="text-xs text-muted-foreground">{tx.date} · {tx.account}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">+{formatMoney(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Configuración de ingresos</SheetTitle></SheetHeader>
          <div className="space-y-6 mt-6">
            <div>
              <Label className="text-xs text-muted-foreground">Meta mensual de ingresos</Label>
              <Input type="number" value={goalForm} onChange={e => setGoalForm(e.target.value)} className="mt-1" placeholder="25000" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Porcentajes por frasco</p>
              <p className="text-xs text-muted-foreground mb-4">Deben sumar 100%</p>
              {jarOrder.map(jar => {
                const key = jar === 'financial_freedom' ? 'financialFreedom' : jar === 'long_term_savings' ? 'longTermSavings' : jar;
                return (
                  <div key={jar} className="flex items-center gap-3 mb-3">
                    <span className="text-lg w-8">{JAR_ICONS[jar]}</span>
                    <span className="text-sm text-foreground flex-1">{JAR_LABELS[jar]}</span>
                    <div className="flex items-center gap-1">
                      <Input type="number" className="w-16 text-right" value={(jarForm as any)[key]}
                        onChange={e => setJarForm(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                );
              })}
              {(() => {
                const total = jarForm.necessities + jarForm.financialFreedom + jarForm.education + jarForm.play + jarForm.longTermSavings + jarForm.give;
                return <p className={cn("text-xs font-medium", total === 100 ? "text-success" : "text-danger")}>Total: {total}%</p>;
              })()}
            </div>
            <Button onClick={handleSaveSettings} className="w-full">Guardar configuración</Button>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
