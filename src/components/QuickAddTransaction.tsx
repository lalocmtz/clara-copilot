import { useState, useEffect } from "react";
import { Plus, X, ArrowLeftRight, CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAppData } from "@/context/AppContext";
import { useCreditCards } from "@/services/credit-cards";
import { cn } from "@/lib/utils";

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type TxType = 'expense' | 'income' | 'transfer';

export default function QuickAddTransaction({ open: controlledOpen, onOpenChange }: Props) {
  const { categories, accounts, addTransaction } = useAppData();
  const { data: creditCards = [] } = useCreditCards();
  const topAccounts = accounts.slice(0, 3);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { onOpenChange?.(v); setInternalOpen(v); };

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');

  const activeCats = categories.filter(c => c.active && c.type === (type === 'income' ? 'income' : 'expense')).slice(0, 6);

  const [selectedCategory, setSelectedCategory] = useState(activeCats[0]?.id || '');
  const [selectedAccount, setSelectedAccount] = useState(topAccounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const filtered = categories.filter(c => c.active && c.type === (type === 'income' ? 'income' : 'expense'));
    if (filtered.length) setSelectedCategory(filtered[0].id);
    else setSelectedCategory('');
  }, [type, categories]);

  useEffect(() => {
    if (topAccounts.length && !selectedAccount) setSelectedAccount(topAccounts[0].id);
  }, [topAccounts]);

  // Auto-select a different destination account
  useEffect(() => {
    if (type === 'transfer' && accounts.length > 1) {
      const other = accounts.find(a => a.id !== selectedAccount);
      if (other) setToAccountId(other.id);
    }
  }, [type, selectedAccount, accounts]);

  const handleSave = () => {
    if (!amount) return;
    const cat = categories.find(c => c.id === selectedCategory);
    const acc = accounts.find(a => a.id === selectedAccount);
    const toAcc = accounts.find(a => a.id === toAccountId);

    // Find matching credit card if account is credit type
    const selectedAcc = accounts.find(a => a.id === selectedAccount);
    let creditCardId: string | undefined;
    if (selectedAcc?.type === 'credit') {
      // Match by name (case-insensitive) to find the credit_cards entry
      const matchedCard = creditCards.find(c => c.name.toLowerCase() === selectedAcc.name.toLowerCase());
      creditCardId = matchedCard?.id;
    }

    addTransaction({
      type,
      amount: parseFloat(amount),
      currency: 'MXN',
      date: date.toISOString().slice(0, 10),
      category: type === 'transfer' ? 'Transferencia' : (cat?.name || 'Otros'),
      categoryIcon: type === 'transfer' ? '↔' : (cat?.icon || '📦'),
      account: acc?.name || '',
      toAccount: type === 'transfer' ? (toAcc?.name || '') : undefined,
      notes: notes || undefined,
      creditCardId,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); setAmount(''); setNotes(''); setDate(new Date()); setType('expense'); }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && amount) { e.preventDefault(); handleSave(); }
  };

  const destAccounts = accounts.filter(a => a.id !== selectedAccount);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105">
        <Plus className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card w-full sm:w-[28rem] sm:rounded-2xl rounded-t-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              {saved ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-12 text-center">
                  <div className="text-4xl mb-3">✓</div>
                  <p className="text-foreground font-medium">Movimiento guardado.</p>
                  <p className="text-muted-foreground text-sm mt-1">Todo claro.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Registrar</h2>
                    <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-accent transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>

                  <div className="flex bg-secondary rounded-lg p-1 mb-6">
                    {(['expense', 'income', 'transfer'] as TxType[]).map(t => (
                      <button key={t} onClick={() => setType(t)}
                        className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all",
                          type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                        {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Transferencia'}
                      </button>
                    ))}
                  </div>

                  <div className="mb-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl text-muted-foreground font-light">
                        {type === 'expense' ? '–' : type === 'income' ? '+' : '↔'} $
                      </span>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder="0" autoFocus className="text-4xl font-semibold text-foreground bg-transparent outline-none w-40 text-center placeholder:text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">MXN</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm hover:bg-accent transition-colors">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          {format(date, "d MMM yyyy", { locale: es })}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Category - hidden for transfers */}
                  {type !== 'transfer' && (
                    <div className="mb-5">
                      <label className="text-label mb-2 block">Categoría</label>
                      <div className="grid grid-cols-3 gap-2">
                        {activeCats.map((cat) => (
                          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                            className={cn("py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center gap-2",
                              selectedCategory === cat.id ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                            <span>{cat.icon}</span><span className="truncate">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-5">
                    <label className="text-label mb-2 block">{type === 'transfer' ? 'Cuenta origen' : 'Cuenta'}</label>
                    <div className="flex gap-2">
                      {topAccounts.map((acc) => (
                        <button key={acc.id} onClick={() => setSelectedAccount(acc.id)}
                          className={cn("flex-1 py-2 px-3 rounded-lg text-sm transition-all duration-200",
                            selectedAccount === acc.id ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination account for transfers */}
                  {type === 'transfer' && (
                    <div className="mb-5">
                      <label className="text-label mb-2 block">Cuenta destino</label>
                      <div className="flex gap-2 flex-wrap">
                        {destAccounts.map((acc) => (
                          <button key={acc.id} onClick={() => setToAccountId(acc.id)}
                            className={cn("flex-1 py-2 px-3 rounded-lg text-sm transition-all duration-200",
                              toAccountId === acc.id ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20" : "bg-secondary text-muted-foreground hover:bg-accent")}>
                            {acc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="text-label mb-2 block">Notas (opcional)</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder="Ej: Tacos con el equipo"
                      className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20 transition-all" />
                  </div>

                  <button onClick={handleSave} disabled={!amount || (type === 'transfer' && !toAccountId)}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                    Guardar
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
