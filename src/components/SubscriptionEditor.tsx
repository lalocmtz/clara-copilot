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

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

export default function SubscriptionEditor({ subscription, isNew, open, onOpenChange }: Props) {
  const { addSubscription, updateSubscription, deleteSubscription, categories } = useAppData();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [billingDay, setBillingDay] = useState('');
  const [subType, setSubType] = useState<'digital' | 'fixed'>('digital');
  const [category, setCategory] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('🔄');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeCategories = categories.filter(c => c.active);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(subscription.amount.toString());
      setFrequency(subscription.frequency);
      setBillingDay(subscription.billingDay?.toString() || '');
      setSubType(subscription.subType || 'digital');
      setCategory(subscription.category || '');
      setCategoryIcon(subscription.categoryIcon || '🔄');
    } else {
      setName(''); setAmount(''); setFrequency('monthly');
      setBillingDay(''); setSubType('digital'); setCategory(''); setCategoryIcon('🔄');
    }
    setConfirmDelete(false);
  }, [subscription, open]);

  const parsedAmount = parseFloat(amount) || 0;
  const monthlyEq = frequency === 'yearly' ? parsedAmount / 12 : parsedAmount;
  const annualEq = frequency === 'monthly' ? parsedAmount * 12 : parsedAmount;

  const handleCategorySelect = (catName: string, catIcon: string) => {
    setCategory(catName);
    setCategoryIcon(catIcon);
  };

  const handleSave = () => {
    if (!name || !amount || !billingDay) return;
    const day = parseInt(billingDay);
    if (day < 1 || day > 31) return;

    const data: Omit<Subscription, "id"> = {
      name, amount: parsedAmount, frequency, nextDate: '',
      paid: subscription?.paid ?? false,
      billingDay: day, subType, category, categoryIcon,
    };

    if (isNew || !subscription) {
      addSubscription(data);
    } else {
      updateSubscription(subscription.id, { ...data });
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
              <h2 className="text-lg font-semibold text-foreground">{isNew ? 'Nuevo gasto recurrente' : 'Editar gasto recurrente'}</h2>
              <button onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex bg-secondary rounded-lg p-1 mb-4">
              {([['digital', '📱 Suscripción'], ['fixed', '🏠 Gasto fijo']] as const).map(([t, label]) => (
                <button key={t} onClick={() => setSubType(t)}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all",
                    subType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                  {label}
                </button>
              ))}
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder={subType === 'digital' ? 'Ej: Netflix' : 'Ej: Renta'}
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Monto</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Frequency */}
            <div className="flex bg-secondary rounded-lg p-1 mb-4">
              {(['monthly', 'yearly'] as const).map(f => (
                <button key={f} onClick={() => setFrequency(f)}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all",
                    frequency === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                  {f === 'monthly' ? 'Mensual' : 'Anual'}
                </button>
              ))}
            </div>

            {/* Cost equivalents */}
            {parsedAmount > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground mb-4 px-1">
                <span>≈ {formatMoney(monthlyEq)}/mes</span>
                <span>≈ {formatMoney(annualEq)}/año</span>
              </div>
            )}

            {/* Billing day */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Día de cobro (1-31)</label>
              <input type="number" min={1} max={31} value={billingDay} onChange={e => setBillingDay(e.target.value)} placeholder="15"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="text-label mb-2 block">Categoría</label>
              <div className="flex flex-wrap gap-2">
                {activeCategories.map(c => (
                  <button key={c.id} onClick={() => handleCategorySelect(c.name, c.icon)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                      category === c.name ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                    <span>{c.icon}</span> {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {!isNew && subscription && (
                <button onClick={handleDelete}
                  className={cn("py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    confirmDelete ? "bg-danger text-white" : "bg-secondary text-danger hover:bg-danger/10")}>
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete ? 'Confirmar' : 'Eliminar'}
                </button>
              )}
              <button onClick={handleSave} disabled={!name || !amount || !billingDay}
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
