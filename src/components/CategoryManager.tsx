import { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppData } from "@/context/AppContext";

const emojiOptions = ['🍽', '🚗', '💡', '📢', '🔄', '🎮', '🏥', '💰', '💻', '📦', '🏠', '✈️', '🎓', '🛍', '☕', '🎵', '📱', '🐶'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CategoryManager({ open, onOpenChange }: Props) {
  const { categories, addCategory, updateCategory, toggleCategory } = useAppData();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');

  const startEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
  };

  const saveEdit = () => {
    if (editingId) updateCategory(editingId, { name: editName, icon: editIcon });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory({ name: newName, icon: newIcon });
    setNewName(''); setNewIcon('📦'); setAdding(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}>
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card w-full sm:w-[28rem] sm:rounded-2xl rounded-t-2xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Categorías</h2>
              <button onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-accent transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className={`flex items-center gap-3 p-3 rounded-lg ${cat.active ? 'bg-secondary' : 'bg-secondary/50 opacity-50'}`}>
                  {editingId === cat.id ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-1 flex-wrap">
                        {emojiOptions.slice(0, 9).map(e => (
                          <button key={e} onClick={() => setEditIcon(e)}
                            className={`w-8 h-8 rounded text-sm flex items-center justify-center ${editIcon === e ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-accent'}`}>{e}</button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="flex-1 text-sm bg-card rounded-lg px-3 py-1.5 outline-none text-foreground" autoFocus />
                        <button onClick={saveEdit} className="text-xs text-primary font-medium px-2">Listo</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground px-2">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-lg">{cat.icon}</span>
                      <span className="flex-1 text-sm text-foreground font-medium">{cat.name}</span>
                      <button onClick={() => startEdit(cat)} className="p-1 hover:bg-accent rounded transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => toggleCategory(cat.id)} className="p-1 hover:bg-accent rounded transition-colors">
                        <Trash2 className={`w-3.5 h-3.5 ${cat.active ? 'text-muted-foreground' : 'text-danger'}`} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {adding ? (
              <div className="mt-4 p-3 rounded-lg bg-secondary space-y-2">
                <div className="flex gap-1 flex-wrap">
                  {emojiOptions.slice(0, 9).map(e => (
                    <button key={e} onClick={() => setNewIcon(e)}
                      className={`w-8 h-8 rounded text-sm flex items-center justify-center ${newIcon === e ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-accent'}`}>{e}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Nombre de categoría" className="flex-1 text-sm bg-card rounded-lg px-3 py-1.5 outline-none text-foreground placeholder:text-muted-foreground/50" autoFocus />
                  <button onClick={handleAdd} className="text-xs text-primary font-medium px-2">Agregar</button>
                  <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground px-2">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)}
                className="mt-4 w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Nueva categoría
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
