import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { FileText, Loader2 } from "lucide-react";

interface StatementImport {
  id: string;
  file_name: string;
  account_name: string;
  transactions_count: number;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function formatPeriod(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const s = new Date(start);
  const e = new Date(end);
  const sLabel = s.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
  const eLabel = e.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
  return sLabel === eLabel ? sLabel : `${sLabel} – ${eLabel}`;
}

export default function StatementHistory({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const [imports, setImports] = useState<StatementImport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("statement_imports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setImports((data as StatementImport[]) || []);
        setLoading(false);
      });
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de importaciones</DialogTitle>
          <DialogDescription>Estados de cuenta que has cargado a la plataforma.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : imports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aún no has importado ningún estado de cuenta.</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {imports.map((imp) => (
              <div key={imp.id} className="flex items-start gap-3 py-3">
                <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{imp.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {imp.account_name} · {imp.transactions_count} movimientos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Periodo: {formatPeriod(imp.period_start, imp.period_end)} · Cargado {formatDate(imp.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
