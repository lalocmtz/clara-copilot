import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/mock-data";

interface Props {
  account: Account | null;
  isNew?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeLabels: Record<string, string> = { checking: 'Débito', savings: 'Ahorro', credit: 'Crédito', debt: 'Deuda' };

export default function AccountEditor({ account, isNew, open, onOpenChange }: Props) {
  const { addAccount, updateAccount, deleteAccount } = useAppData();

  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('checking');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [cutoffDate, setCutoffDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(Math.abs(account.balance).toString());
      setCreditLimit(account.creditLimit?.toString() || '');
      setCutoffDate(account.cutoffDate?.toString() || '');
      setPaymentDate(account.paymentDate?.toString() || '');
    } else {
      setName(''); setType('checking'); setBalance(''); setCreditLimit(''); setCutoffDate(''); setPaymentDate('');
    }
    setConfirmDelete(false);
  }, [account, open]);

  const handleSave = () => {
    if (!name || !balance) return;
    const bal = (type === 'credit' || type === 'debt') ? -Math.abs(parseFloat(balance)) : parseFloat(balance);
    const data: Omit<Account, "id"> = {
      name, type, balance: bal, currency: 'MXN',
      ...(type === 'credit' ? {
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
        cutoffDate: cutoffDate ? parseInt(cutoffDate) : undefined,
        paymentDate: paymentDate ? parseInt(paymentDate) : undefined,
      } : {}),
    };
    if (isNew || !account) {
      addAccount(data);
    } else {
      updateAccount(account.id, { ...data, id: account.id });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!account) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteAccount(account.id);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}>
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card w-full sm:w-[28rem] sm:rounded-2xl rounded-t-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">{isNew ? 'Nueva cuenta' : 'Editar cuenta'}</h2>
              <button onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 bg-secondary rounded-lg p-1 mb-5">
              {(['checking', 'savings', 'credit', 'debt'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={cn("py-2 text-sm font-medium rounded-md transition-all", type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                  {typeLabels[t]}
                </button>
              ))}
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-label mb-2 block">{type === 'debt' ? 'Descripción de la deuda' : 'Nombre'}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder={type === 'debt' ? 'Ej: Le debo a Juan' : 'Ej: BBVA Débito'}
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Balance */}
            <div className="mb-4">
              <label className="text-label mb-2 block">
                {type === 'credit' ? 'Saldo (deuda)' : type === 'debt' ? 'Monto que debes' : 'Saldo'}
              </label>
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Credit fields */}
            {type === 'credit' && (
              <>
                <div className="mb-4">
                  <label className="text-label mb-2 block">Límite de crédito</label>
                  <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-label mb-2 block">Día de corte</label>
                    <input type="number" value={cutoffDate} onChange={e => setCutoffDate(e.target.value)} min="1" max="31"
                      className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/20" />
                  </div>
                  <div>
                    <label className="text-label mb-2 block">Día de pago</label>
                    <input type="number" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} min="1" max="31"
                      className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/20" />
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {!isNew && account && (
                <button onClick={handleDelete}
                  className={cn("py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    confirmDelete ? "bg-danger text-white" : "bg-secondary text-danger hover:bg-danger/10")}>
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete ? 'Confirmar' : 'Eliminar'}
                </button>
              )}
              <button onClick={handleSave} disabled={!name || !balance}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40">
                {isNew ? 'Agregar cuenta' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
