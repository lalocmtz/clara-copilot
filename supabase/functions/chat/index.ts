import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claims.claims.sub;
    const { messages } = await req.json();

    // Load financial context
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [txResult, budgetResult, accResult, cardResult, debtResult, recResult, jarResult] = await Promise.all([
      supabase.from("transactions").select("type, amount, category, merchant, date")
        .eq("user_id", userId).gte("date", `${currentMonth}-01`).order("date", { ascending: false }).limit(100),
      supabase.from("budgets").select("category, category_icon, budgeted, spent")
        .eq("user_id", userId).eq("period", currentMonth),
      supabase.from("accounts").select("name, type, balance")
        .eq("user_id", userId).eq("active", true),
      supabase.from("credit_cards").select("name, bank, current_balance, credit_limit, available_credit")
        .eq("user_id", userId).eq("active", true),
      supabase.from("debts").select("name, current_balance, minimum_payment, apr")
        .eq("user_id", userId).eq("active", true),
      supabase.from("receivables").select("debtor_name, amount_total, amount_paid, status")
        .eq("user_id", userId).in("status", ["pending", "partial"]),
      supabase.from("jar_settings").select("*")
        .eq("user_id", userId).order("effective_from", { ascending: false }).limit(1),
    ]);

    const txs = txResult.data || [];
    const monthExp = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const monthInc = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

    const catSpending: Record<string, number> = {};
    txs.filter(t => t.type === "expense").forEach(t => {
      catSpending[t.category] = (catSpending[t.category] || 0) + Number(t.amount);
    });
    const catBreakdown = Object.entries(catSpending).sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: $${amt}`).join(", ");

    const budgetLines = (budgetResult.data || [])
      .map(b => `${b.category_icon} ${b.category}: gastado $${b.spent} de $${b.budgeted} (${b.budgeted > 0 ? Math.round((b.spent / b.budgeted) * 100) : 0}%)`)
      .join("\n");

    const accountLines = (accResult.data || []).map(a => `${a.name} (${a.type}): $${a.balance}`).join(", ");
    const cardLines = (cardResult.data || []).map(c => `${c.name} (${c.bank}): saldo $${c.current_balance}, límite $${c.credit_limit}`).join("; ");
    const debtLines = (debtResult.data || []).map(d => `${d.name}: $${d.current_balance}`).join("; ");
    const recLines = (recResult.data || []).map(r => `${r.debtor_name}: $${r.amount_total - r.amount_paid}`).join("; ");

    const totalDebt = (debtResult.data || []).reduce((s, d) => s + Number(d.current_balance), 0);
    const totalRec = (recResult.data || []).reduce((s, r) => s + (Number(r.amount_total) - Number(r.amount_paid)), 0);

    const systemPrompt = `Eres Clara, una CFO personal inteligente, amigable y directa. Respondes siempre en español.

DATOS FINANCIEROS DEL USUARIO (mes actual: ${currentMonth}):

💰 INGRESOS DEL MES: $${monthInc}
💸 GASTOS DEL MES: $${monthExp}
📊 BALANCE: $${monthInc - monthExp}

🏷 GASTO POR CATEGORÍA:
${catBreakdown || "Sin gastos registrados"}

📋 PRESUPUESTOS:
${budgetLines || "Sin presupuestos configurados"}

🏦 CUENTAS:
${accountLines || "Sin cuentas"}

💳 TARJETAS DE CRÉDITO:
${cardLines || "Sin tarjetas"}

📉 DEUDAS ACTIVAS: ${debtLines || "Ninguna"} (Total: $${totalDebt})

🧾 POR COBRAR: ${recLines || "Nada pendiente"} (Total: $${totalRec})

INSTRUCCIONES:
- Responde basándote en los datos reales del usuario.
- Sé concisa y útil. Usa emojis moderadamente.
- Si te piden un análisis, da insights accionables.
- Si te piden registrar una transacción, explica que puede hacerlo desde la app o por Telegram.
- Puedes dar recomendaciones financieras personalizadas basándote en los patrones de gasto.
- Usa formato Markdown para estructurar tus respuestas cuando sea apropiado.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Error del asistente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
