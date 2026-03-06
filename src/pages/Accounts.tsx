import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import AccountEditor from "@/components/AccountEditor";
import InvestmentEditor from "@/components/InvestmentEditor";
import { useAppData } from "@/context/AppContext";
import { useCreditCards, getUtilizationPct } from "@/services/credit-cards";
import { useFinancialPosition } from "@/services/financial-position";
import { CreditCard, Landmark, PiggyBank, TrendingUp, BarChart3, Plus, ChevronDown, HandCoins, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account, Investment } from "@/lib/mock-data";
import { motion } from "framer-motion";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Math.abs(n));
}

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

const investIcons: Record<string, typeof TrendingUp> = { crypto: TrendingUp, acciones: BarChart3, fondo: BarChart3, negocio: TrendingUp };

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
  const navigate = useNavigate();
  const { accounts, investments } = useAppData();
  const { data: creditCards = [] } = useCreditCards();
  const pos = useFinancialPosition();
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
  const [isNewInvestment, setIsNewInvestment] = useState(false);

  // Filter: only real money accounts (no credit type)
  const liquid = accounts.filter(a => a.type === 'checking' || a.type === 'savings');
  const activeCards = creditCards.filter(c => c.active);

  const openNew = () => { setEditAccount(null); setIsNew(true); };
  const openEdit = (acc: Account) => { setEditAccount(acc); setIsNew(false); };
  const openNewInvestment = () => { setEditInvestment(null); setIsNewInvestment(true); };
  const openEditInvestment = (inv: Investment) => { setEditInvestment(inv); setIsNewInvestment(false); };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Posición financiera</h2>
            <p className="text-muted-foreground text-sm mt-1">Tu dinero real, crédito y obligaciones</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity">
            <Plus className="w-4 h-4" /> Agregar cuenta
          </button>
        </div>

        {/* Summary: 3 key metrics */}
        <motion.div {...fadeIn} className="space-y-3">
          <div className="card-calm p-5">
            <p className="text-label">Liquidez real</p>
            <p className="text-xs text-muted-foreground">Lo que sí tienes hoy</p>
            <p className="text-3xl font-bold text-foreground mt-2">{formatMoney(pos.realLiquidity)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-calm p-4">
              <p className="text-label">Crédito disponible</p>
              <p className="text-xs text-muted-foreground mt-0.5">Lo que podrías usar, pero te endeuda</p>
              <p className="text-lg font-bold text-primary mt-2">{formatMoney(pos.totalCreditAvailable)}</p>
              <p className="text-xs text-muted-foreground">de {formatMoney(pos.totalCreditLimit)}</p>
            </div>
            <div className="card-calm p-4">
              <p className="text-label">Invertido</p>
              <p className="text-xs text-muted-foreground mt-0.5">Patrimonio a largo plazo</p>
              <p className="text-lg font-bold text-foreground mt-2">{formatMoney(pos.investmentTotal)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-calm p-4">
              <p className="text-label">Deuda tarjetas</p>
              <p className="text-lg font-bold text-danger mt-1">–{formatMoney(pos.totalCardDebt)}</p>
            </div>
            <div className="card-calm p-4">
              <p className="text-label">Deuda no tarjeta</p>
              <p className="text-lg font-bold text-danger mt-1">–{formatMoney(pos.totalNonCardDebt)}</p>
            </div>
          </div>
          <div className="card-calm p-4 bg-secondary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Capacidad inmediata</p>
                <p className="text-xs text-muted-foreground">Colchón total de corto plazo</p>
              </div>
              <p className="text-xl font-bold text-foreground">{formatMoney(pos.immediateCapacity)}</p>
            </div>
          </div>
        </motion.div>

        {/* Block 1: Liquidez real */}
        {liquid.length > 0 && (
          <CollapsibleSection title="Liquidez real" icon={Landmark} onAdd={openNew}
            badge={<span className="text-sm font-semibold text-foreground">{formatMoney(pos.realLiquidity)}</span>}>
            {liquid.map((acc) => {
              const Icon = acc.type === 'savings' ? PiggyBank : Landmark;
              return (
                <button key={acc.id} onClick={() => openEdit(acc)} className="w-full flex items-center gap-3 p-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.type === 'checking' ? 'Débito' : 'Ahorro'}</p>
                    {acc.balanceUpdatedAt && (
                      <p className="text-xs text-muted-foreground/70">Actualizado: {formatDistanceToNow(new Date(acc.balanceUpdatedAt), { addSuffix: true, locale: es })}</p>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatMoney(acc.balance)}</p>
                </button>
              );
            })}
          </CollapsibleSection>
        )}

        {/* Block 2: Inversiones */}
        {investments.length > 0 && (
          <CollapsibleSection title="Inversiones" icon={TrendingUp} onAdd={openNewInvestment}
            badge={<span className="text-sm font-semibold text-foreground">{formatMoney(pos.investmentTotal)}</span>}>
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

        {/* Block 3: Crédito disponible (summary of credit cards) */}
        {activeCards.length > 0 && (
          <CollapsibleSection title="Crédito disponible" icon={CreditCard}
            badge={<span className="text-sm font-semibold text-primary">{formatMoney(pos.totalCreditAvailable)}</span>}>
            {activeCards.map((card) => {
              const util = getUtilizationPct(card);
              const available = card.creditLimit - Math.abs(card.currentBalance);
              return (
                <div key={card.id} className="p-4 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground">{card.bank}{card.lastFour ? ` •••• ${card.lastFour}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatMoney(available)} disp.</p>
                      <p className="text-xs text-muted-foreground">Usado: {formatMoney(card.currentBalance)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all",
                      util >= 60 ? "bg-danger" : util >= 40 ? "bg-warning" : "bg-primary"
                    )} style={{ width: `${Math.min(util, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            <button onClick={() => navigate('/cards')}
              className="w-full p-3 text-center text-sm text-primary font-medium hover:bg-accent/30 transition-colors flex items-center justify-center gap-1">
              Gestionar tarjetas <ArrowRight className="w-3 h-3" />
            </button>
          </CollapsibleSection>
        )}

        {/* Block 4: Pasivos */}
        {pos.totalDebt > 0 && (
          <CollapsibleSection title="Pasivos" icon={HandCoins}
            badge={<span className="text-sm font-semibold text-danger">–{formatMoney(pos.totalDebt)}</span>}>
            <div className="p-4 space-y-2">
              {pos.totalCardDebt > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Deuda de tarjetas</span>
                  </div>
                  <span className="text-sm font-semibold text-danger">–{formatMoney(pos.totalCardDebt)}</span>
                </div>
              )}
              {pos.totalNonCardDebt > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HandCoins className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Otras deudas</span>
                  </div>
                  <span className="text-sm font-semibold text-danger">–{formatMoney(pos.totalNonCardDebt)}</span>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/debts')}
              className="w-full p-3 text-center text-sm text-primary font-medium hover:bg-accent/30 transition-colors flex items-center justify-center gap-1 border-t border-border">
              Ver estrategia de deuda <ArrowRight className="w-3 h-3" />
            </button>
          </CollapsibleSection>
        )}
      </div>
      <QuickAddTransaction />
      <AccountEditor account={editAccount} isNew={isNew} open={!!editAccount || isNew} onOpenChange={(o) => { if (!o) { setEditAccount(null); setIsNew(false); } }} />
      <InvestmentEditor investment={editInvestment} isNew={isNewInvestment} open={!!editInvestment || isNewInvestment} onOpenChange={(o) => { if (!o) { setEditInvestment(null); setIsNewInvestment(false); } }} />
    </Layout>
  );
}
