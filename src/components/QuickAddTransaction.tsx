import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categories, accounts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const topCategories = categories.slice(0, 6);
const topAccounts = accounts.slice(0, 3);

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function QuickAddTransaction({ open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    setInternalOpen(v);
  };

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(topCategories[0].id);
  const [selectedAccount, setSelectedAccount] = useState(topAccounts[0].id);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!amount) return;
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setAmount('');
      setNotes('');
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && amount) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card w-full sm:w-[28rem] sm:rounded-2xl rounded-t-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {saved ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-12 text-center"
                >
                  <div className="text-4xl mb-3">✓</div>
                  <p className="text-foreground font-medium">Movimiento guardado.</p>
                  <p className="text-muted-foreground text-sm mt-1">Todo claro.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground">Registrar</h2>
                    <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Toggle */}
                  <div className="flex bg-secondary rounded-lg p-1 mb-6">
                    <button
                      onClick={() => setType('expense')}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200",
                        type === 'expense' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Gasto
                    </button>
                    <button
                      onClick={() => setType('income')}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200",
                        type === 'income' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Ingreso
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="mb-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-2xl text-muted-foreground font-light">
                        {type === 'expense' ? '–' : '+'} $
                      </span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="0"
                        autoFocus
                        className="text-4xl font-semibold text-foreground bg-transparent outline-none w-40 text-center placeholder:text-muted-foreground/30"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">MXN</p>
                  </div>

                  {/* Category */}
                  <div className="mb-5">
                    <label className="text-label mb-2 block">Categoría</label>
                    <div className="grid grid-cols-3 gap-2">
                      {topCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center gap-2",
                            selectedCategory === cat.id
                              ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20"
                              : "bg-secondary text-muted-foreground hover:bg-accent"
                          )}
                        >
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account */}
                  <div className="mb-5">
                    <label className="text-label mb-2 block">Cuenta</label>
                    <div className="flex gap-2">
                      {topAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedAccount(acc.id)}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg text-sm transition-all duration-200",
                            selectedAccount === acc.id
                              ? "bg-sidebar-accent text-sidebar-accent-foreground border border-primary/20"
                              : "bg-secondary text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {acc.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-6">
                    <label className="text-label mb-2 block">Notas (opcional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ej: Tacos con el equipo"
                      className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20 transition-all"
                    />
                  </div>

                  {/* Save */}
                  <button
                    onClick={handleSave}
                    disabled={!amount}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
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
