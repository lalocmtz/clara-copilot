import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Bot, Copy, Check, Loader2, ExternalLink, Unlink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function TelegramLink() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);

  // Check if user already has a telegram link
  const checkLinkStatus = useCallback(async () => {
    if (!user) return;
    setCheckingLink(true);
    const { data } = await supabase
      .from("telegram_links")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    setIsLinked(!!data);
    setCheckingLink(false);
  }, [user]);

  useEffect(() => {
    checkLinkStatus();
  }, [checkLinkStatus]);

  // Auto-setup webhook + get bot username when modal opens
  async function setupAndGenerateCode() {
    if (!user) return;
    setLoading(true);
    setOpen(true);
    try {
      // 1. Setup webhook + get bot username (silent)
      const { data: setupData } = await supabase.functions.invoke("telegram-setup");
      if (setupData?.bot_username) {
        setBotUsername(setupData.bot_username);
      }

      // 2. Generate link code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await supabase.from("telegram_link_codes").insert({
        user_id: user.id,
        code: newCode,
        expires_at: expiresAt,
      } as any);
      if (error) throw error;
      setCode(newCode);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function unlinkTelegram() {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("telegram_links")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
      setIsLinked(false);
      toast({ title: "Desvinculado", description: "Tu cuenta de Telegram ha sido desvinculada." });
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

  if (checkingLink) {
    return (
      <button className="card-calm p-3 flex flex-col items-center gap-2" disabled>
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        <span className="text-xs font-medium text-foreground">Telegram</span>
      </button>
    );
  }

  // Already linked state
  if (isLinked) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="card-calm p-3 flex flex-col items-center gap-2 hover:bg-accent/50 transition-colors relative"
        >
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium text-foreground">Telegram</span>
          <Badge variant="default" className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0 bg-primary">
            <Check className="w-3 h-3" />
          </Badge>
        </button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" /> Telegram vinculado
              </DialogTitle>
              <DialogDescription>
                Tu cuenta está conectada. Envía mensajes a tu bot para registrar gastos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-primary/10 rounded-lg p-4">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Cuenta vinculada</p>
                  <p className="text-xs text-muted-foreground">Tu bot de Telegram está activo y listo.</p>
                </div>
              </div>

              <div className="bg-accent/30 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">Envía mensajes como:</p>
                <p className="text-xs text-muted-foreground">• "Gasté 200 en uber"</p>
                <p className="text-xs text-muted-foreground">• "Ingreso 5000 nómina"</p>
                <p className="text-xs text-muted-foreground">• "150 comida BBVA"</p>
                <p className="text-xs text-muted-foreground">• /resumen para ver tu mes</p>
              </div>

              <Button
                onClick={unlinkTelegram}
                disabled={loading}
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Unlink className="w-4 h-4 mr-2" />}
                Desvincular Telegram
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Not linked state
  return (
    <>
      <button
        onClick={setupAndGenerateCode}
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
              Registra gastos e ingresos enviando mensajes de texto a tu bot.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparando tu vinculación...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Step 1: Open bot */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <p className="text-sm font-medium text-foreground">Abre tu bot en Telegram</p>
                </div>
                {botUsername ? (
                  <Button
                    asChild
                    className="w-full"
                  >
                    <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir @{botUsername} en Telegram
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground pl-8">Busca tu bot en Telegram y ábrelo.</p>
                )}
              </div>

              {/* Step 2: Send code */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <p className="text-sm font-medium text-foreground">Envía este comando al bot</p>
                </div>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-3 ml-8">
                  <code className="flex-1 text-sm font-mono text-foreground">/vincular {code}</code>
                  <Button size="icon" variant="ghost" onClick={copyCommand}>
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground pl-8">⏱ El código expira en 10 minutos.</p>
              </div>

              {/* Step 3: Done */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <p className="text-sm font-medium text-foreground">¡Listo! Empieza a registrar</p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3 ml-8 space-y-1">
                  <p className="text-xs text-muted-foreground">• "Gasté 200 en uber"</p>
                  <p className="text-xs text-muted-foreground">• "Ingreso 5000 nómina"</p>
                  <p className="text-xs text-muted-foreground">• "150 comida BBVA"</p>
                  <p className="text-xs text-muted-foreground">• /resumen para ver tu mes</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
