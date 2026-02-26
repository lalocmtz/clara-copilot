import { useState, useEffect } from "react";
import { X, Trash2, CalendarPlus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Transaction } from "@/lib/mock-data";

type TxType = 'expense' | 'income' | 'transfer';

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransactionEditor({ transaction, open, onOpenChange }: Props) {
  const { updateTransaction, deleteTransaction, addSubscription, categories, accounts } = useAppData();

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');

  const activeCats = categories.filter(c => c.active && c.type === (type === 'income' ? 'income' : 'expense'));
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [notes, setNotes] = useState('');
  const [merchant, setMerchant] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addedAsSub, setAddedAsSub] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type as TxType);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setAccount(transaction.account);
      setToAccount(transaction.toAccount || '');
      setNotes(transaction.notes || '');
      setMerchant(transaction.merchant || '');
      setConfirmDelete(false);
      setAddedAsSub(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = () => {
    if (!amount) return;
    const cat = activeCats.find(c => c.name === category);
    updateTransaction(transaction.id, {
      type,
      amount: parseFloat(amount),
      category: type === 'transfer' ? 'Transferencia' : category,
      account,
      toAccount: type === 'transfer' ? toAccount : undefined,
      notes: notes || undefined,
      merchant: merchant || undefined,
      categoryIcon: type === 'transfer' ? '↔' : (cat?.icon || transaction.categoryIcon),
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteTransaction(transaction.id);
    onOpenChange(false);
  };

  const destAccounts = accounts.filter(a => a.name !== account);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}>
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card w-full sm:w-[28rem] sm:rounded-2xl rounded-t-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Editar movimiento</h2>
              <button onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex bg-secondary rounded-lg p-1 mb-5">
              {(['expense', 'income', 'transfer'] as TxType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                  {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Transferencia'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mb-5 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl text-muted-foreground font-light">
                  {type === 'expense' ? '–' : type === 'income' ? '+' : '↔'} $
                </span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="text-4xl font-semibold text-foreground bg-transparent outline-none w-40 text-center" />
              </div>
            </div>

            {/* Category - hidden for transfers */}
            {type !== 'transfer' && (
              <div className="mb-4">
                <label className="text-label mb-2 block">Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {activeCats.map(c => (
                    <button key={c.id} onClick={() => setCategory(c.name)}
                      className={cn("py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-all",
                        category === c.name ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                      <span>{c.icon}</span><span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account */}
            <div className="mb-4">
              <label className="text-label mb-2 block">{type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}</label>
              <div className="flex gap-2 flex-wrap">
                {accounts.map(a => (
                  <button key={a.id} onClick={() => setAccount(a.name)}
                    className={cn("py-2 px-3 rounded-lg text-sm transition-all",
                      account === a.name ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination account for transfers */}
            {type === 'transfer' && (
              <div className="mb-4">
                <label className="text-label mb-2 block">Cuenta destino</label>
                <div className="flex gap-2 flex-wrap">
                  {destAccounts.map(a => (
                    <button key={a.id} onClick={() => setToAccount(a.name)}
                      className={cn("py-2 px-3 rounded-lg text-sm transition-all",
                        toAccount === a.name ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Merchant */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Comercio (opcional)</label>
              <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-label mb-2 block">Notas (opcional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Add as subscription - only for expenses */}
            {type === 'expense' && (
              <button
                onClick={() => {
                  const billingDay = transaction.date ? new Date(transaction.date).getDate() : 1;
                  const subName = merchant || category || 'Suscripción';
                  addSubscription({
                    name: subName,
                    amount: parseFloat(amount) || transaction.amount,
                    frequency: 'monthly',
                    nextDate: '',
                    paid: false,
                    billingDay,
                    subType: 'digital',
                    category: category || transaction.category,
                    categoryIcon: transaction.categoryIcon,
                  });
                  toast.success(`${subName} agregado a suscripciones`);
                  setAddedAsSub(true);
                }}
                disabled={addedAsSub}
                className={cn(
                  "w-full py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 mb-6",
                  addedAsSub
                    ? "bg-success/10 text-success cursor-default"
                    : "bg-secondary text-foreground hover:bg-accent"
                )}
              >
                {addedAsSub ? <Check className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />}
                {addedAsSub ? 'Agregado a suscripciones' : 'Agregar como suscripción recurrente'}
              </button>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleDelete}
                className={cn("py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                  confirmDelete ? "bg-danger text-white" : "bg-secondary text-danger hover:bg-danger/10")}>
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? '¿Seguro? Confirmar' : 'Eliminar'}
              </button>
              <button onClick={handleSave} disabled={!amount || (type === 'transfer' && !toAccount)}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40">
                Guardar cambios
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
