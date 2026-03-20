import { useState } from "react";
import Layout from "@/components/Layout";
import TelegramLink from "@/components/TelegramLink";
import ChatAssistant from "@/components/ChatAssistant";
import { useFinancialPreferences, useFinancialPreferencesMutations } from "@/services/preferences";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Bot, Bell, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };
const toneLabels = { calm: '🧘 Calmado', direct: '⚡ Directo', ambitious: '🔥 Ambicioso' };

export default function Assistant() {
  const { data: prefs } = useFinancialPreferences();
  const { upsert } = useFinancialPreferencesMutations();
  const [telegramOpen, setTelegramOpen] = useState(false);

  const handleToggleDigest = async (enabled: boolean) => {
    await upsert.mutateAsync({ telegramDailyDigestEnabled: enabled });
  };
  const handleToneChange = async (tone: string) => {
    await upsert.mutateAsync({ motivationalTone: tone as any });
  };
  const handleHourChange = async (hour: string) => {
    await upsert.mutateAsync({ telegramDigestHour: parseInt(hour) });
  };

  const commands = [
    { cmd: '/resumen', desc: 'Resumen financiero del día' },
    { cmd: '/presupuestos', desc: 'Estado de tus presupuestos' },
    { cmd: '/deudas', desc: 'Resumen de deudas activas' },
    { cmd: '/tarjetas', desc: 'Estado de tarjetas de crédito' },
    { cmd: '/porcobrar', desc: 'Lo que te deben' },
    { cmd: '/frascos', desc: 'Distribución de ingresos' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div {...fadeIn}>
          <h2 className="text-2xl font-bold text-foreground">Asistente</h2>
          <p className="text-muted-foreground text-sm mt-1">Tu CFO personal — Clara</p>
        </motion.div>

        {/* Chat */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Chat con Clara</h3>
          </div>
          <ChatAssistant />
        </motion.div>

        {/* Telegram connection */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="card-calm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Telegram</p>
                <p className="text-xs text-muted-foreground">Conecta para registrar gastos y consultar desde Telegram</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setTelegramOpen(true)}>
              Configurar
            </Button>
          </div>
        </motion.div>

        {/* Commands */}
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="card-calm p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Comandos de Telegram</h3>
          <div className="space-y-2">
            {commands.map(c => (
              <div key={c.cmd} className="flex items-center gap-3">
                <code className="text-xs bg-secondary px-2 py-1 rounded text-primary font-mono">{c.cmd}</code>
                <span className="text-xs text-muted-foreground">{c.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notification settings */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="card-calm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Recordatorios</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Resumen diario</p>
              <p className="text-xs text-muted-foreground">Presupuestos, ingresos, pagos próximos</p>
            </div>
            <Switch checked={prefs?.telegramDailyDigestEnabled || false} onCheckedChange={handleToggleDigest} />
          </div>

          {prefs?.telegramDailyDigestEnabled && (
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Hora del resumen</Label>
              <Select value={String(prefs?.telegramDigestHour || 8)} onValueChange={handleHourChange}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[6, 7, 8, 9, 10, 20, 21, 22].map(h => <SelectItem key={h} value={String(h)}>{h}:00</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Tono motivacional</p>
              <p className="text-xs text-muted-foreground">Cómo te habla Clara</p>
            </div>
            <Select value={prefs?.motivationalTone || 'calm'} onValueChange={handleToneChange}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(toneLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </div>

      <Dialog open={telegramOpen} onOpenChange={setTelegramOpen}>
        <DialogContent className="max-w-md">
          <TelegramLink />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
