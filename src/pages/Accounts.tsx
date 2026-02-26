import { useState } from "react";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import AccountEditor from "@/components/AccountEditor";
import InvestmentEditor from "@/components/InvestmentEditor";
import { useAppData } from "@/context/AppContext";
import { CreditCard, Landmark, PiggyBank, TrendingUp, BarChart3, Plus, ChevronDown, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account, Investment } from "@/lib/mock-data";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Math.abs(n));
}

const icons: Record<string, typeof Landmark> = { checking: Landmark, savings: PiggyBank, credit: CreditCard, debt: HandCoins };
const investIcons: Record<string, typeof TrendingUp> = { crypto: TrendingUp, acciones: BarChart3, fondo: BarChart3, negocio: TrendingUp };

const DEBT_COLORS = ['hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(210, 60%, 55%)'];

function CollapsibleSection({ title, icon: Icon, badge, defaultOpen = true, onAdd, children }: {
  title: string; icon: typeof Landmark; badge?: React.ReactNode; defaultOpen?: boolean; onAdd?: () => void; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-calm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground flex-1 text-left">{title}</span>
        {badge}
        {onAdd && (
          <span onClick={(e) => { e.stopPropagation(); onAdd(); }} className="p-1 rounded-md hover:bg-accent transition-colors text-primary">
            <Plus className="w-4 h-4" />
          </span>
        )}
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

export default function Accounts() {
  const { accounts, investments } = useAppData();
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newType, setNewType] = useState<Account['type']>('checking');
  const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
  const [isNewInvestment, setIsNewInvestment] = useState(false);

  const liquid = accounts.filter(a => a.type === 'checking' || a.type === 'savings');
  const credit = accounts.filter(a => a.type === 'credit');
  const debts = accounts.filter(a => a.type === 'debt');

  const totalLiquid = liquid.reduce((s, a) => s + a.balance, 0);
  const totalCreditDebt = Math.abs(credit.reduce((s, a) => s + a.balance, 0));
  const totalCreditLimit = credit.reduce((s, a) => s + (a.creditLimit || 0), 0);
  const totalCreditAvailable = totalCreditLimit - totalCreditDebt;
  const totalExternalDebt = Math.abs(debts.reduce((s, a) => s + a.balance, 0));
  const totalDebt = totalCreditDebt + totalExternalDebt;
  const totalInvested = investments.reduce((s, i) => s + i.current_value, 0);

  const openNew = (type: Account['type'] = 'checking') => { setEditAccount(null); setIsNew(true); setNewType(type); };
  const openEdit = (acc: Account) => { setEditAccount(acc); setIsNew(false); };
  const openNewInvestment = () => { setEditInvestment(null); setIsNewInvestment(true); };
  const openEditInvestment = (inv: Investment) => { setEditInvestment(inv); setIsNewInvestment(false); };

  // Debt diversification pie
  const debtPieData = [
    ...credit.map(c => ({ name: c.name, value: Math.abs(c.balance), type: 'Tarjeta' })),
    ...debts.map(d => ({ name: d.name, value: Math.abs(d.balance), type: 'Deuda' })),
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-sm">
          <p className="font-medium">{d.name}</p>
          <p className="text-muted-foreground">{d.type}: {formatMoney(d.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cuentas</h2>
            <p className="text-muted-foreground text-sm mt-1">Tu posición financiera</p>
          </div>
          <button onClick={() => openNew()} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-calm p-4">
            <p className="text-label">Liquidez</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatMoney(totalLiquid)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-label">Deuda total</p>
            <p className="text-xl font-bold text-danger mt-1">–{formatMoney(totalDebt)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-label">Crédito disponible</p>
            <p className="text-xl font-bold text-primary mt-1">{formatMoney(totalCreditAvailable)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">de {formatMoney(totalCreditLimit)}</p>
          </div>
          <div className="card-calm p-4">
            <p className="text-label">Invertido</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatMoney(totalInvested)}</p>
          </div>
        </div>

        {/* Debt breakdown pie - only if there's debt */}
        {debtPieData.length > 1 && (
          <div className="card-calm p-4">
            <p className="text-label mb-3">Diversificación de deuda</p>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={debtPieData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={2}>
                      {debtPieData.map((_, i) => (
                        <Cell key={i} fill={DEBT_COLORS[i % DEBT_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {debtPieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DEBT_COLORS[i % DEBT_COLORS.length] }} />
                    <span className="text-muted-foreground truncate flex-1">{d.name}</span>
                    <span className="font-medium text-foreground flex-shrink-0">{formatMoney(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Liquidez section */}
        {liquid.length > 0 && (
          <CollapsibleSection title="Liquidez" icon={Landmark} onAdd={() => openNew('checking')}
            badge={<span className="text-sm font-semibold text-foreground">{formatMoney(totalLiquid)}</span>}>
            {liquid.map((acc) => {
              const Icon = icons[acc.type];
              return (
                <button key={acc.id} onClick={() => openEdit(acc)} className="w-full flex items-center gap-3 p-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.type === 'checking' ? 'Débito' : 'Ahorro'}</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatMoney(acc.balance)}</p>
                </button>
              );
            })}
          </CollapsibleSection>
        )}

        {/* Tarjetas de crédito section */}
        {credit.length > 0 && (
          <CollapsibleSection title="Tarjetas de crédito" icon={CreditCard} onAdd={() => openNew('credit')}
            badge={<span className="text-sm font-semibold text-danger">–{formatMoney(totalCreditDebt)}</span>}>
            {credit.map((acc) => {
              const available = (acc.creditLimit || 0) - Math.abs(acc.balance);
              const usagePct = acc.creditLimit ? Math.min((Math.abs(acc.balance) / acc.creditLimit) * 100, 100) : 0;
              return (
                <button key={acc.id} onClick={() => openEdit(acc)} className="w-full p-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><CreditCard className="w-4 h-4 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{acc.name}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
                        {acc.cutoffDate && <span>Corte: {acc.cutoffDate}</span>}
                        {acc.paymentDate && <span>Pago: {acc.paymentDate}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-semibold text-danger">–{formatMoney(acc.balance)}</p>
                      <p className="text-xs text-muted-foreground">Disponible: {formatMoney(available)}</p>
                    </div>
                  </div>
                  {/* Usage bar */}
                  <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", usagePct > 70 ? "bg-danger" : usagePct > 40 ? "bg-warning" : "bg-primary")}
                      style={{ width: `${usagePct}%` }} />
                  </div>
                </button>
              );
            })}
          </CollapsibleSection>
        )}

        {/* Deudas section */}
        {debts.length > 0 && (
          <CollapsibleSection title="Deudas" icon={HandCoins} onAdd={() => openNew('debt')}
            badge={<span className="text-sm font-semibold text-danger">–{formatMoney(totalExternalDebt)}</span>}>
            {debts.map((acc) => (
              <button key={acc.id} onClick={() => openEdit(acc)} className="w-full flex items-center gap-3 p-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><HandCoins className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{acc.name}</p>
                  <p className="text-xs text-muted-foreground">Deuda externa</p>
                </div>
                <p className="text-lg font-semibold text-danger">–{formatMoney(acc.balance)}</p>
              </button>
            ))}
          </CollapsibleSection>
        )}

        {/* Add debt button if no debts exist */}
        {debts.length === 0 && (
          <button onClick={() => openNew('debt')}
            className="card-calm w-full p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
            <HandCoins className="w-4 h-4" /> Agregar deuda
          </button>
        )}

        {/* Inversiones section */}
        {investments.length > 0 && (
          <CollapsibleSection title="Inversiones" icon={TrendingUp} onAdd={openNewInvestment}
            badge={<span className="text-sm font-semibold text-foreground">{formatMoney(totalInvested)}</span>}>
            {investments.map((inv) => {
              const Icon = investIcons[inv.type] || TrendingUp;
              const gain = inv.current_value - inv.cost_basis;
              const gainPct = inv.cost_basis > 0 ? Math.round((gain / inv.cost_basis) * 100) : 0;
              return (
                <button key={inv.id} onClick={() => openEditInvestment(inv)} className="w-full flex items-center gap-3 p-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{inv.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold text-foreground">{formatMoney(inv.current_value)}</p>
                    <p className={cn("text-xs font-medium", gain >= 0 ? "text-success" : "text-danger")}>{gain >= 0 ? '+' : ''}{gainPct}%</p>
                  </div>
                </button>
              );
            })}
          </CollapsibleSection>
        )}
      </div>
      <QuickAddTransaction />
      <AccountEditor account={editAccount} isNew={isNew} open={!!editAccount || isNew} onOpenChange={(o) => { if (!o) { setEditAccount(null); setIsNew(false); } }} />
      <InvestmentEditor investment={editInvestment} isNew={isNewInvestment} open={!!editInvestment || isNewInvestment} onOpenChange={(o) => { if (!o) { setEditInvestment(null); setIsNewInvestment(false); } }} />
    </Layout>
  );
}
