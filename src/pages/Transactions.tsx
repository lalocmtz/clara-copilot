import { useState } from "react";
import Layout from "@/components/Layout";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import TransactionEditor from "@/components/TransactionEditor";
import StatementImporter from "@/components/StatementImporter";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/mock-data";
import { Upload, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

type FilterType = 'all' | 'expense' | 'income' | 'transfer';

export default function Transactions() {
  const { transactions } = useAppData();
  const [filter, setFilter] = useState<FilterType>('all');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
  // Exclude transfers from balance total
  const total = filtered.reduce((s, t) => {
    if (t.type === 'transfer') return s;
    return s + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Transacciones</h2>
            <p className="text-muted-foreground text-sm mt-1">Febrero 2026</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Importar
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'expense', 'income', 'transfer'] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
              {f === 'all' ? 'Todos' : f === 'expense' ? 'Gastos' : f === 'income' ? 'Ingresos' : 'Transferencias'}
            </button>
          ))}
        </div>

        <div className="card-calm p-4">
          <p className="text-label">Balance del periodo</p>
          <p className={cn("text-2xl font-semibold mt-1", total >= 0 ? "text-success" : "text-foreground")}>{formatMoney(total)}</p>
        </div>

        <div className="card-calm divide-y divide-border">
          {filtered.map((tx) => (
            <button key={tx.id} onClick={() => setEditTx(tx)} className="flex items-center justify-between p-4 w-full text-left hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-lg">{tx.type === 'transfer' ? '↔' : tx.categoryIcon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground font-medium">
                      {tx.type === 'transfer'
                        ? `De ${tx.account} a ${tx.toAccount || '?'}`
                        : (tx.merchant || tx.notes || tx.category)}
                    </p>
                    {tx.type === 'transfer' && (
                      <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">Transferencia</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tx.type === 'transfer' ? 'Movimiento entre cuentas' : `${tx.category} · ${tx.account}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-semibold",
                  tx.type === 'income' ? "text-success" : tx.type === 'transfer' ? "text-warning" : "text-foreground")}>
                  {tx.type === 'expense' ? '–' : tx.type === 'transfer' ? '↔' : '+'} {formatMoney(tx.amount)}
                </p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <QuickAddTransaction />
      <TransactionEditor transaction={editTx} open={!!editTx} onOpenChange={(o) => !o && setEditTx(null)} />
      <StatementImporter open={importOpen} onOpenChange={setImportOpen} />
    </Layout>
  );
}
