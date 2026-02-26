import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import { accounts } from "@/lib/mock-data";
import { CreditCard, Landmark, PiggyBank } from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(Math.abs(n));
}

const icons = { checking: Landmark, savings: PiggyBank, credit: CreditCard };

export default function Accounts() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cuentas</h2>
          <p className="text-muted-foreground text-sm mt-1">Tus balances actuales</p>
        </div>

        <div className="grid gap-4">
          {accounts.map((acc) => {
            const Icon = icons[acc.type];
            return (
              <div key={acc.id} className="card-calm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{acc.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{acc.type === 'checking' ? 'Débito' : acc.type === 'savings' ? 'Ahorro' : 'Crédito'}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">
                    {acc.balance < 0 && '–'}{formatMoney(acc.balance)}
                  </p>
                </div>
                {acc.type === 'credit' && (
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
                )}
              </div>
            );
          })}
        </div>
      </div>
      <QuickAddTransaction />
    </Layout>
  );
}
