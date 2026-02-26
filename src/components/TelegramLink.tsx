import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Bot, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function TelegramLink() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  async function generateCode() {
    if (!user) return;
    setLoading(true);
    try {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error } = await supabase.from("telegram_link_codes").insert({
        user_id: user.id,
        code: newCode,
        expires_at: expiresAt,
      } as any);

      if (error) throw error;
      setCode(newCode);
      setOpen(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function setupWebhook() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-setup");
      if (error) throw error;
      setSetupDone(true);
      toast({ title: "✅ Webhook configurado", description: "Tu bot ya está listo para recibir mensajes." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function copyCommand() {
    navigator.clipboard.writeText(`/vincular ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={generateCode}
        disabled={loading}
        className="card-calm p-3 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors"
      >
        {loading ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" /> : <Bot className="w-5 h-5 text-muted-foreground" />}
        <span className="text-xs font-medium text-foreground">Telegram</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" /> Vincular Telegram
            </DialogTitle>
            <DialogDescription>
              Conecta tu bot de Telegram para registrar gastos con mensajes de texto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step 1: Setup webhook (one time) */}
            {!setupDone && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Paso 1:</strong> Configura el webhook (solo una vez).
                </p>
                <Button onClick={setupWebhook} disabled={loading} variant="outline" className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Configurar webhook
                </Button>
              </div>
            )}

            {/* Step 2: Link code */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>{setupDone ? "Paso 2" : "Paso 2"}:</strong> Abre tu bot en Telegram y envía este comando:
              </p>
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                <code className="flex-1 text-sm font-mono text-foreground">/vincular {code}</code>
                <Button size="icon" variant="ghost" onClick={copyCommand}>
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">⏱ El código expira en 10 minutos.</p>
            </div>

            {/* Instructions */}
            <div className="bg-accent/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Después de vincular, envía mensajes como:</p>
              <p className="text-xs text-muted-foreground">• "Gasté 200 en uber"</p>
              <p className="text-xs text-muted-foreground">• "Ingreso 5000 nómina"</p>
              <p className="text-xs text-muted-foreground">• "150 comida BBVA"</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
