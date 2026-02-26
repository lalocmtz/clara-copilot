import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppData } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { Investment } from "@/lib/mock-data";

interface Props {
  investment: Investment | null;
  isNew?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeLabels: Record<string, string> = {
  crypto: 'Crypto',
  acciones: 'Acciones',
  fondo: 'Fondo',
  negocio: 'Negocio',
};

export default function InvestmentEditor({ investment, isNew, open, onOpenChange }: Props) {
  const { addInvestment, updateInvestment, deleteInvestment } = useAppData();

  const [name, setName] = useState('');
  const [type, setType] = useState<Investment['type']>('crypto');
  const [currentValue, setCurrentValue] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setType(investment.type);
      setCurrentValue(investment.current_value.toString());
      setCostBasis(investment.cost_basis.toString());
      setLastUpdated(investment.last_updated);
    } else {
      setName(''); setType('crypto'); setCurrentValue(''); setCostBasis('');
      setLastUpdated(new Date().toISOString().split('T')[0]);
    }
    setConfirmDelete(false);
  }, [investment, open]);

  const handleSave = () => {
    if (!name || !currentValue || !costBasis) return;
    const data = {
      name, type,
      current_value: parseFloat(currentValue),
      cost_basis: parseFloat(costBasis),
      last_updated: lastUpdated,
    };
    if (isNew || !investment) {
      addInvestment(data);
    } else {
      updateInvestment(investment.id, data);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!investment) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteInvestment(investment.id);
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
              <h2 className="text-lg font-semibold text-foreground">{isNew ? 'Nueva inversión' : 'Editar inversión'}</h2>
              <button onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type */}
            <div className="flex bg-secondary rounded-lg p-1 mb-5">
              {(['crypto', 'acciones', 'fondo', 'negocio'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all", type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                  {typeLabels[t]}
                </button>
              ))}
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Bitcoin"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Current Value */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Valor actual</label>
              <input type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="0"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Cost Basis */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Costo base (lo que invertiste)</label>
              <input type="number" value={costBasis} onChange={e => setCostBasis(e.target.value)} placeholder="0"
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="text-label mb-2 block">Fecha de actualización</label>
              <input type="date" value={lastUpdated} onChange={e => setLastUpdated(e.target.value)}
                className="w-full py-2 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-ring/20" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {!isNew && investment && (
                <button onClick={handleDelete}
                  className={cn("py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    confirmDelete ? "bg-danger text-white" : "bg-secondary text-danger hover:bg-danger/10")}>
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete ? 'Confirmar' : 'Eliminar'}
                </button>
              )}
              <button onClick={handleSave} disabled={!name || !currentValue || !costBasis}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40">
                {isNew ? 'Agregar inversión' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
