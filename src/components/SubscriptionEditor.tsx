import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/lib/mock-data";

interface Props {
  subscription: Subscription | null;
  isNew?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionEditor({ subscription, isNew, open, onOpenChange }: Props) {
  const { addSubscription, updateSubscription, deleteSubscription } = useAppData();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [nextDate, setNextDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(subscription.amount.toString());
      setFrequency(subscription.frequency);
      setNextDate(subscription.nextDate);
    } else {
      setName(''); setAmount(''); setFrequency('monthly'); setNextDate('');
    }
    setConfirmDelete(false);
  }, [subscription, open]);

  const handleSave = () => {
    if (!name || !amount || !nextDate) return;
    const data: Omit<Subscription, "id"> = { name, amount: parseFloat(amount), frequency, nextDate, paid: subscription?.paid ?? false };
    if (isNew || !subscription) {
      addSubscription(data);
    } else {
      updateSubscription(subscription.id, data);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!subscription) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteSubscription(subscription.id);
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
              <h2 className="text-lg font-semibold text-foreground">{isNew ? 'Nueva suscripción' : 'Editar suscripción'}</h2>
              <button onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-label mb-2 block">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Netflix"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            <div className="mb-4">
              <label className="text-label mb-2 block">Monto</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            <div className="flex bg-secondary rounded-lg p-1 mb-4">
              {(['monthly', 'yearly'] as const).map(f => (
                <button key={f} onClick={() => setFrequency(f)}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", frequency === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                  {f === 'monthly' ? 'Mensual' : 'Anual'}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-label mb-2 block">Próxima fecha de cobro</label>
              <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/20" />
            </div>

            <div className="flex gap-3">
              {!isNew && subscription && (
                <button onClick={handleDelete}
                  className={cn("py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    confirmDelete ? "bg-danger text-white" : "bg-secondary text-danger hover:bg-danger/10")}>
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete ? 'Confirmar' : 'Eliminar'}
                </button>
              )}
              <button onClick={handleSave} disabled={!name || !amount || !nextDate}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40">
                {isNew ? 'Agregar' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
