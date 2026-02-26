import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { accounts, investments } from "@/lib/mock-data";
import { CreditCard, Landmark, PiggyBank, TrendingUp, BarChart3 } from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Math.abs(n));
}

const icons = { checking: Landmark, savings: PiggyBank, credit: CreditCard };
const investIcons: Record<string, typeof TrendingUp> = { crypto: TrendingUp, acciones: BarChart3, fondo: BarChart3, negocio: TrendingUp };

export default function Accounts() {
  const liquid = accounts.filter(a => a.type !== 'credit');
  const credit = accounts.filter(a => a.type === 'credit');

  const totalLiquid = liquid.reduce((s, a) => s + a.balance, 0);
  const totalDebt = Math.abs(credit.reduce((s, a) => s + a.balance, 0));
  const totalInvested = investments.reduce((s, i) => s + i.current_value, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cuentas</h2>
          <p className="text-muted-foreground text-sm mt-1">Tu posición financiera</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card-calm p-4 text-center">
            <p className="text-label">Liquidez</p>
            <p className="text-lg font-semibold text-foreground mt-1">{formatMoney(totalLiquid)}</p>
          </div>
          <div className="card-calm p-4 text-center">
            <p className="text-label">Deuda</p>
            <p className="text-lg font-semibold text-danger mt-1">–{formatMoney(totalDebt)}</p>
          </div>
          <div className="card-calm p-4 text-center">
            <p className="text-label">Invertido</p>
            <p className="text-lg font-semibold text-foreground mt-1">{formatMoney(totalInvested)}</p>
          </div>
        </div>

        {/* Liquidez */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Liquidez</h3>
          <div className="grid gap-3">
            {liquid.map((acc) => {
              const Icon = icons[acc.type];
              return (
                <div key={acc.id} className="card-calm p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{acc.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{acc.type === 'checking' ? 'Débito' : 'Ahorro'}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{formatMoney(acc.balance)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crédito */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Crédito</h3>
          <div className="grid gap-3">
            {credit.map((acc) => (
              <div key={acc.id} className="card-calm p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{acc.name}</p>
                      <p className="text-xs text-muted-foreground">Crédito</p>
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-danger">–{formatMoney(acc.balance)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex gap-6 text-sm">
                  <div>
                    <p className="text-label">Límite</p>
                    <p className="text-foreground font-medium">{formatMoney(acc.creditLimit!)}</p>
                  </div>
                  <div>
                    <p className="text-label">Corte</p>
                    <p className="text-foreground font-medium">Día {acc.cutoffDate}</p>
                  </div>
                  <div>
                    <p className="text-label">Pago</p>
                    <p className="text-foreground font-medium">Día {acc.paymentDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inversiones */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Inversiones</h3>
          <div className="grid gap-3">
            {investments.map((inv) => {
              const Icon = investIcons[inv.type] || TrendingUp;
              const gain = inv.current_value - inv.cost_basis;
              const gainPct = Math.round((gain / inv.cost_basis) * 100);
              return (
                <div key={inv.id} className="card-calm p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{inv.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{inv.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-foreground">{formatMoney(inv.current_value)}</p>
                      <p className={`text-xs font-medium ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
                        {gain >= 0 ? '+' : ''}{gainPct}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <QuickAddTransaction />
    </Layout>
  );
}
