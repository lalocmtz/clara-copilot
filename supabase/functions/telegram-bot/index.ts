import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTg(token: string, chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

function fmt(n: number): string {
  return `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(spent: number, budgeted: number): string {
  if (!budgeted) return "—";
  return `${Math.round((spent / budgeted) * 100)}%`;
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

    // === /ayuda | /start | /help ===
    if (text === "/ayuda" || text === "/start" || text === "/help") {
      await sendTg(TELEGRAM_BOT_TOKEN, chatId,
        "🤖 *Clara — Tu CFO personal*\n\n" +
        "📝 Registra gastos:\n" +
        "• _Gasté 200 en uber_\n" +
        "• _Ingreso 5000 nómina_\n\n" +
        "💬 Pregunta lo que quieras:\n" +
        "• _¿Cuánto gasté en comida?_\n" +
        "• _¿Cómo van mis presupuestos?_\n\n" +
        "📌 Comandos rápidos:\n" +
        "• `/resumen` — Resumen del mes\n" +
        "• `/presupuestos` — Estado de presupuestos\n" +
        "• `/deudas` — Deudas activas\n" +
        "• `/tarjetas` — Tarjetas de crédito\n" +
        "• `/porcobrar` — Lo que te deben\n" +
        "• `/frascos` — Distribución de ingresos\n" +
        "• `/vincular CODIGO` — Vincular cuenta"
      );
      return new Response("ok");
    }

    // === /vincular ===
    if (text.startsWith("/vincular")) {
      const code = text.split(" ")[1]?.trim();
      if (!code || code.length !== 6) {
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "❌ Envía: `/vincular CODIGO` con el código de 6 dígitos de la app.");
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
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "❌ Código inválido o expirado. Genera uno nuevo en la app.");
        return new Response("ok");
      }

      const { data: existing } = await supabase
        .from("telegram_links")
        .select("id")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

      if (existing) {
        await supabase.from("telegram_links").update({ user_id: linkCode.user_id }).eq("telegram_chat_id", chatId);
      } else {
        await supabase.from("telegram_links").insert({ user_id: linkCode.user_id, telegram_chat_id: chatId });
      }

      await supabase.from("telegram_link_codes").update({ used: true }).eq("id", linkCode.id);
      await sendTg(TELEGRAM_BOT_TOKEN, chatId, "✅ ¡Cuenta vinculada! Ya puedes registrar gastos y hacer consultas.");
      return new Response("ok");
    }

    // === Check linked user ===
    const { data: link } = await supabase
      .from("telegram_links")
      .select("user_id")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    if (!link) {
      await sendTg(TELEGRAM_BOT_TOKEN, chatId,
        "⚠️ Tu Telegram no está vinculado. Abre la app y genera un código, luego envía: `/vincular CODIGO`"
      );
      return new Response("ok");
    }

    const userId = link.user_id;
    const currentMonth = new Date().toISOString().slice(0, 7);

    // === /resumen ===
    if (text === "/resumen") {
      const { data: txs } = await supabase
        .from("transactions").select("type, amount, category")
        .eq("user_id", userId).gte("date", `${currentMonth}-01`);

      const expenses = (txs || []).filter(t => t.type === "expense");
      const income = (txs || []).filter(t => t.type === "income");
      const totalExp = expenses.reduce((s, t) => s + Number(t.amount), 0);
      const totalInc = income.reduce((s, t) => s + Number(t.amount), 0);

      const byCat: Record<string, number> = {};
      expenses.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount); });
      const catLines = Object.entries(byCat)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([cat, amt]) => `  • ${cat}: ${fmt(amt)}`).join("\n");

      await sendTg(TELEGRAM_BOT_TOKEN, chatId,
        `📊 *Resumen del mes*\n\n💰 Ingresos: ${fmt(totalInc)}\n💸 Gastos: ${fmt(totalExp)}\n📈 Balance: ${fmt(totalInc - totalExp)}\n\n` +
        (catLines ? `🏷 Top categorías:\n${catLines}` : "Sin gastos aún.")
      );
      return new Response("ok");
    }

    // === /presupuestos ===
    if (text === "/presupuestos") {
      const { data: budgets } = await supabase
        .from("budgets").select("category, category_icon, budgeted, spent")
        .eq("user_id", userId).eq("period", currentMonth);

      if (!budgets?.length) {
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "📋 No tienes presupuestos configurados para este mes.");
        return new Response("ok");
      }

      const lines = budgets.map(b => {
        const p = pct(b.spent, b.budgeted);
        const bar = b.budgeted > 0 ? (b.spent / b.budgeted > 0.9 ? "🔴" : b.spent / b.budgeted > 0.7 ? "🟡" : "🟢") : "⚪";
        return `${bar} ${b.category_icon} *${b.category}*\n   ${fmt(b.spent)} / ${fmt(b.budgeted)} (${p})`;
      }).join("\n\n");

      const totalBudgeted = budgets.reduce((s, b) => s + Number(b.budgeted), 0);
      const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);

      await sendTg(TELEGRAM_BOT_TOKEN, chatId,
        `📋 *Presupuestos del mes*\n\n${lines}\n\n📊 Total: ${fmt(totalSpent)} / ${fmt(totalBudgeted)} (${pct(totalSpent, totalBudgeted)})`
      );
      return new Response("ok");
    }

    // === /deudas ===
    if (text === "/deudas") {
      const { data: debts } = await supabase
        .from("debts").select("name, current_balance, minimum_payment, apr, creditor")
        .eq("user_id", userId).eq("active", true);

      if (!debts?.length) {
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "✅ No tienes deudas activas. ¡Excelente!");
        return new Response("ok");
      }

      const lines = debts.map(d => {
        let line = `• *${d.name}*: ${fmt(d.current_balance)}`;
        if (d.minimum_payment) line += ` (min: ${fmt(d.minimum_payment)})`;
        if (d.apr) line += ` — ${d.apr}% APR`;
        if (d.creditor) line += `\n  _${d.creditor}_`;
        return line;
      }).join("\n");

      const total = debts.reduce((s, d) => s + Number(d.current_balance), 0);
      await sendTg(TELEGRAM_BOT_TOKEN, chatId, `💳 *Deudas activas*\n\n${lines}\n\n📊 Total: ${fmt(total)}`);
      return new Response("ok");
    }

    // === /tarjetas ===
    if (text === "/tarjetas") {
      const { data: cards } = await supabase
        .from("credit_cards").select("name, bank, current_balance, credit_limit, available_credit, due_day, minimum_payment, no_interest_payment")
        .eq("user_id", userId).eq("active", true);

      if (!cards?.length) {
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "💳 No tienes tarjetas de crédito registradas.");
        return new Response("ok");
      }

      const lines = cards.map(c => {
        const avail = c.available_credit ?? (c.credit_limit - c.current_balance);
        let line = `💳 *${c.name}* (${c.bank})\n   Saldo: ${fmt(c.current_balance)} / Límite: ${fmt(c.credit_limit)}\n   Disponible: ${fmt(avail)}`;
        if (c.due_day) line += ` — Pago día ${c.due_day}`;
        if (c.minimum_payment) line += `\n   Min: ${fmt(c.minimum_payment)}`;
        if (c.no_interest_payment) line += ` | Sin intereses: ${fmt(c.no_interest_payment)}`;
        return line;
      }).join("\n\n");

      await sendTg(TELEGRAM_BOT_TOKEN, chatId, `💳 *Tarjetas de crédito*\n\n${lines}`);
      return new Response("ok");
    }

    // === /porcobrar ===
    if (text === "/porcobrar") {
      const { data: recs } = await supabase
        .from("receivables").select("debtor_name, amount_total, amount_paid, due_date, concept, status")
        .eq("user_id", userId).in("status", ["pending", "partial"]);

      if (!recs?.length) {
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "✅ No tienes cuentas por cobrar pendientes.");
        return new Response("ok");
      }

      const lines = recs.map(r => {
        const remaining = r.amount_total - r.amount_paid;
        let line = `• *${r.debtor_name}*: ${fmt(remaining)}`;
        if (r.concept) line += ` — ${r.concept}`;
        if (r.due_date) line += `\n  Vence: ${r.due_date}`;
        return line;
      }).join("\n");

      const totalPending = recs.reduce((s, r) => s + (r.amount_total - r.amount_paid), 0);
      await sendTg(TELEGRAM_BOT_TOKEN, chatId, `🧾 *Por cobrar*\n\n${lines}\n\n📊 Total pendiente: ${fmt(totalPending)}`);
      return new Response("ok");
    }

    // === /frascos ===
    if (text === "/frascos") {
      const { data: jars } = await supabase
        .from("jar_settings").select("*")
        .eq("user_id", userId).order("effective_from", { ascending: false }).limit(1);

      const jar = jars?.[0];
      if (!jar) {
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "🏺 No tienes configuración de frascos. Configúralos en la app.");
        return new Response("ok");
      }

      const jarLabels: Record<string, string> = {
        necessities: "🏠 Necesidades",
        financial_freedom: "📈 Libertad financiera",
        education: "📚 Educación",
        play: "🎮 Diversión",
        long_term_savings: "🏦 Ahorro largo plazo",
        give: "🎁 Donaciones",
      };

      const lines = Object.entries(jarLabels).map(([key, label]) => {
        const val = jar[key as keyof typeof jar] as number;
        return `${label}: *${val}%*`;
      }).join("\n");

      await sendTg(TELEGRAM_BOT_TOKEN, chatId, `🏺 *Distribución de frascos*\n\n${lines}`);
      return new Response("ok");
    }

    // === AI: Decide if transaction or query ===
    // Load user context for AI
    const [catResult, accResult, txResult, budgetResult] = await Promise.all([
      supabase.from("categories").select("name, icon").eq("user_id", userId).eq("active", true),
      supabase.from("accounts").select("name, type, balance").eq("user_id", userId),
      supabase.from("transactions").select("type, amount, category, merchant, date")
        .eq("user_id", userId).gte("date", `${currentMonth}-01`).order("date", { ascending: false }).limit(50),
      supabase.from("budgets").select("category, budgeted, spent")
        .eq("user_id", userId).eq("period", currentMonth),
    ]);

    const categories = (catResult.data || []).map(c => `${c.icon} ${c.name}`).join(", ");
    const accounts = (accResult.data || []).map(a => `${a.name} (${a.type}, saldo: ${a.balance})`).join(", ");

    // Build financial context summary for AI
    const txs = txResult.data || [];
    const monthExpenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const monthIncome = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

    const budgetSummary = (budgetResult.data || [])
      .map(b => `${b.category}: gastado ${b.spent}/${b.budgeted}`)
      .join("; ");

    // Category spending breakdown
    const catSpending: Record<string, number> = {};
    txs.filter(t => t.type === "expense").forEach(t => {
      catSpending[t.category] = (catSpending[t.category] || 0) + Number(t.amount);
    });
    const catBreakdown = Object.entries(catSpending)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: $${amt}`)
      .join(", ");

    const systemPrompt = `Eres Clara, una asistente financiera personal inteligente y amigable. Respondes en español.

CONTEXTO FINANCIERO DEL USUARIO (mes actual):
- Ingresos del mes: $${monthIncome}
- Gastos del mes: $${monthExpenses}
- Balance: $${monthIncome - monthExpenses}
- Gasto por categoría: ${catBreakdown || "sin gastos"}
- Presupuestos: ${budgetSummary || "sin presupuestos"}
- Cuentas: ${accounts || "sin cuentas"}
- Categorías disponibles: ${categories}

INSTRUCCIONES:
Analiza el mensaje del usuario y decide qué acción tomar. Responde SOLO con JSON válido (sin markdown, sin backticks).

Si es un REGISTRO DE TRANSACCIÓN (ej: "gasté 200 en uber", "ingreso 5000", "150 comida"):
{"action":"transaction","type":"expense|income","amount":NUMBER,"category":"NOMBRE_EXACTO","category_icon":"EMOJI","account":"NOMBRE_CUENTA","merchant":"COMERCIO_O_NULL","notes":"NOTAS_O_NULL"}

Si es una PREGUNTA o CONSULTA (ej: "cuánto gasté en comida", "cómo van mis presupuestos", "dame un consejo"):
{"action":"query","response":"TU_RESPUESTA_AQUÍ"}
- Usa los datos del contexto financiero para dar respuestas precisas con montos reales.
- Sé concisa pero útil. Puedes dar recomendaciones si es relevante.
- Usa emojis moderadamente.

Si no entiendes el mensaje:
{"action":"error","response":"MENSAJE_DE_ERROR_AMIGABLE"}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      await sendTg(TELEGRAM_BOT_TOKEN, chatId, "❌ Error procesando tu mensaje. Intenta de nuevo.");
      return new Response("ok");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content?.trim();

    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      await sendTg(TELEGRAM_BOT_TOKEN, chatId, "❌ No pude entender tu mensaje. Intenta algo como: _Gasté 200 en uber_ o _¿Cuánto gasté en comida?_");
      return new Response("ok");
    }

    // === Handle query response ===
    if (parsed.action === "query") {
      await sendTg(TELEGRAM_BOT_TOKEN, chatId, parsed.response);
      return new Response("ok");
    }

    // === Handle error ===
    if (parsed.action === "error") {
      await sendTg(TELEGRAM_BOT_TOKEN, chatId, `❌ ${parsed.response}`);
      return new Response("ok");
    }

    // === Handle transaction ===
    if (parsed.action === "transaction") {
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
        await sendTg(TELEGRAM_BOT_TOKEN, chatId, "❌ Error guardando la transacción. Intenta de nuevo.");
        return new Response("ok");
      }

      const typeLabel = parsed.type === "expense" ? "Gasto" : "Ingreso";
      const emoji = parsed.type === "expense" ? "💸" : "💰";
      const merchantLabel = parsed.merchant ? ` (${parsed.merchant})` : "";
      await sendTg(TELEGRAM_BOT_TOKEN, chatId,
        `${emoji} *Registrado:* ${typeLabel} ${fmt(parsed.amount)} en ${parsed.category}${merchantLabel} — ${parsed.account}`
      );
      return new Response("ok");
    }

    await sendTg(TELEGRAM_BOT_TOKEN, chatId, "🤔 No entendí tu mensaje. Intenta de nuevo o escribe /ayuda.");
    return new Response("ok");
  } catch (e) {
    console.error("telegram-bot error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
