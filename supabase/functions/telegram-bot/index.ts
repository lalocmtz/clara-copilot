import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const update = await req.json();
    const message = update.message;
    if (!message?.text) return new Response("ok");

    const chatId = message.chat.id;
    const text = message.text.trim();

    // --- /ayuda ---
    if (text === "/ayuda" || text === "/start" || text === "/help") {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
        "🤖 *Bot de Gastos*\n\n" +
        "📝 Envía un mensaje como:\n" +
        "• _Gasté 200 en uber_\n" +
        "• _Ingreso 5000 nómina_\n" +
        "• _150 comida BBVA_\n\n" +
        "📌 Comandos:\n" +
        "• `/vincular CODIGO` — Vincular tu cuenta\n" +
        "• `/resumen` — Resumen del mes\n" +
        "• `/ayuda` — Ver esta ayuda"
      );
      return new Response("ok");
    }

    // --- /vincular ---
    if (text.startsWith("/vincular")) {
      const code = text.split(" ")[1]?.trim();
      if (!code || code.length !== 6) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Envía: `/vincular CODIGO` con el código de 6 dígitos de la app.");
        return new Response("ok");
      }

      const { data: linkCode, error: codeErr } = await supabase
        .from("telegram_link_codes")
        .select("*")
        .eq("code", code)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (codeErr || !linkCode) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Código inválido o expirado. Genera uno nuevo en la app.");
        return new Response("ok");
      }

      // Check if this chat is already linked
      const { data: existing } = await supabase
        .from("telegram_links")
        .select("id")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

      if (existing) {
        // Update existing link
        await supabase.from("telegram_links").update({ user_id: linkCode.user_id }).eq("telegram_chat_id", chatId);
      } else {
        await supabase.from("telegram_links").insert({ user_id: linkCode.user_id, telegram_chat_id: chatId });
      }

      await supabase.from("telegram_link_codes").update({ used: true }).eq("id", linkCode.id);
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "✅ ¡Cuenta vinculada exitosamente! Ya puedes registrar gastos enviando mensajes.");
      return new Response("ok");
    }

    // --- Check linked user ---
    const { data: link } = await supabase
      .from("telegram_links")
      .select("user_id")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    if (!link) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
        "⚠️ Tu Telegram no está vinculado. Abre la app web y genera un código de vinculación, luego envía: `/vincular CODIGO`"
      );
      return new Response("ok");
    }

    const userId = link.user_id;

    // --- /resumen ---
    if (text === "/resumen") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: txs } = await supabase
        .from("transactions")
        .select("type, amount, category")
        .eq("user_id", userId)
        .gte("date", `${currentMonth}-01`);

      const expenses = (txs || []).filter(t => t.type === "expense");
      const income = (txs || []).filter(t => t.type === "income");
      const totalExp = expenses.reduce((s, t) => s + Number(t.amount), 0);
      const totalInc = income.reduce((s, t) => s + Number(t.amount), 0);

      // Group by category
      const byCat: Record<string, number> = {};
      expenses.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount); });
      const catLines = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, amt]) => `  • ${cat}: $${amt.toLocaleString()}`).join("\n");

      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
        `📊 *Resumen del mes*\n\n` +
        `💰 Ingresos: $${totalInc.toLocaleString()}\n` +
        `💸 Gastos: $${totalExp.toLocaleString()}\n` +
        `📈 Balance: $${(totalInc - totalExp).toLocaleString()}\n\n` +
        (catLines ? `🏷 Top categorías:\n${catLines}` : "Sin gastos aún.")
      );
      return new Response("ok");
    }

    // --- Parse transaction with AI ---
    // Get user's categories and accounts for context
    const [catResult, accResult] = await Promise.all([
      supabase.from("categories").select("name, icon").eq("user_id", userId).eq("active", true),
      supabase.from("accounts").select("name, type").eq("user_id", userId),
    ]);

    const categories = (catResult.data || []).map(c => `${c.icon} ${c.name}`).join(", ");
    const accounts = (accResult.data || []).map(a => a.name).join(", ");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un asistente que extrae datos de transacciones financieras de mensajes en español.
Categorías del usuario: ${categories}
Cuentas del usuario: ${accounts}

Responde SOLO con un JSON válido (sin markdown, sin backticks) con estos campos:
- type: "expense" o "income"
- amount: número
- category: nombre de categoría que mejor coincida (usa exactamente el nombre de la lista)
- category_icon: el emoji de esa categoría
- account: nombre de cuenta que mejor coincida (usa exactamente el nombre de la lista). Si no se menciona, usa la primera cuenta disponible.
- merchant: el comercio o concepto mencionado (o null)
- notes: notas adicionales (o null)

Si no puedes extraer los datos, responde: {"error": "No pude entender el mensaje"}`,
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Error procesando tu mensaje. Intenta de nuevo.");
      return new Response("ok");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content?.trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ No pude entender tu mensaje. Intenta algo como: _Gasté 200 en uber_");
      return new Response("ok");
    }

    if (parsed.error) {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, `❌ ${parsed.error}`);
      return new Response("ok");
    }

    // Insert transaction
    const today = new Date().toISOString().slice(0, 10);
    const { error: insertErr } = await supabase.from("transactions").insert({
      user_id: userId,
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      category_icon: parsed.category_icon || "📦",
      account: parsed.account,
      merchant: parsed.merchant,
      notes: parsed.notes,
      date: today,
      currency: "MXN",
    });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Error guardando la transacción. Intenta de nuevo.");
      return new Response("ok");
    }

    const typeLabel = parsed.type === "expense" ? "Gasto" : "Ingreso";
    const emoji = parsed.type === "expense" ? "💸" : "💰";
    const merchantLabel = parsed.merchant ? ` (${parsed.merchant})` : "";
    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
      `${emoji} *Registrado:* ${typeLabel} $${Number(parsed.amount).toLocaleString()} en ${parsed.category}${merchantLabel} — ${parsed.account}`
    );

    return new Response("ok");
  } catch (e) {
    console.error("telegram-bot error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
