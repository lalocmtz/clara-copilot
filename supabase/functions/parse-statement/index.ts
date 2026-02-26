import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { filePath, accountNames } = await req.json();
    if (!filePath) {
      return new Response(JSON.stringify({ error: "filePath is required" }), { status: 400, headers: corsHeaders });
    }

    // Download the file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("statements")
      .download(filePath);

    if (fileError || !fileData) {
      console.error("Storage download error:", fileError);
      return new Response(JSON.stringify({ error: "Could not download file" }), { status: 400, headers: corsHeaders });
    }

    // Get user's existing categories for context
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("name, icon, type")
      .eq("user_id", userId);

    const existingCategories = (categoriesData || []).map((c: any) => `${c.icon} ${c.name} (${c.type})`).join(", ");

    // Build account names context for transfer detection
    const userAccountNames = Array.isArray(accountNames) ? accountNames : [];
    const accountNamesContext = userAccountNames.length > 0
      ? `\n\nCuentas del usuario: ${userAccountNames.join(", ")}. Si detectas un movimiento que menciona alguna de estas cuentas (ej: "SPEI a ${userAccountNames[0]}", "transferencia ${userAccountNames[1]}", "pago ${userAccountNames[0]}"), clasifícalo como "transfer".`
      : "";

    // Convert file to base64 in chunks to avoid call stack overflow
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64 = btoa(binary);

    // Determine MIME type
    const extension = filePath.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };
    const mimeType = mimeMap[extension] || "application/octet-stream";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });
    }

    const systemPrompt = `Eres un experto en extraer movimientos de estados de cuenta bancarios mexicanos. 
Analiza el documento/imagen proporcionado y extrae TODOS los movimientos que encuentres.

El usuario tiene estas categorías existentes: ${existingCategories || "ninguna aún"}
${accountNamesContext}

Para cada movimiento, determina:
- fecha (formato YYYY-MM-DD)
- monto (número positivo, sin signo)
- tipo: "expense", "income" o "transfer"
- merchant: nombre del comercio o descripción del movimiento
- category: la categoría más apropiada (usa las existentes del usuario si aplican, o sugiere nuevas)
- categoryIcon: emoji representativo de la categoría
- isSubscription: true si parece un cobro recurrente (Netflix, Spotify, gimnasio, seguro, telefonía, internet, etc.)
- subscriptionName: nombre limpio del servicio si isSubscription es true (ej: "Netflix", "Spotify Premium", "Gym Smart Fit")

Reglas de clasificación de tipo:
- "expense": cargos, compras, pagos a comercios, retiros, cobros de servicios
- "income": depósitos de nómina, ingresos reales de freelance, ventas, intereses ganados
- "transfer": pagos a tarjeta de crédito, transferencias entre cuentas propias del usuario, abonos a la tarjeta, traspasos internos. IMPORTANTE: los pagos recibidos en una tarjeta de crédito (abonos) son "transfer", NO "income". Si el movimiento menciona el nombre de alguna cuenta del usuario, es "transfer".

Reglas generales:
- Si no puedes determinar el año, usa 2026
- Extrae TODOS los movimientos sin excepción
- Si es una captura de pantalla de app bancaria, extrae los movimientos visibles
- Marca isSubscription=true para cobros que parezcan recurrentes (servicios digitales, membresías, seguros, telefonía, etc.)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: "Extrae todos los movimientos de este estado de cuenta o captura bancaria.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_transactions",
              description: "Extract all transactions from the bank statement",
              parameters: {
                type: "object",
                properties: {
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "Date in YYYY-MM-DD format" },
                        amount: { type: "number", description: "Positive amount" },
                        type: { type: "string", enum: ["expense", "income", "transfer"] },
                        merchant: { type: "string", description: "Merchant name or description" },
                        category: { type: "string", description: "Category name" },
                        categoryIcon: { type: "string", description: "Emoji icon for the category" },
                        isSubscription: { type: "boolean", description: "True if this looks like a recurring subscription charge" },
                        subscriptionName: { type: "string", description: "Clean name of the subscription service if isSubscription is true" },
                      },
                      required: ["date", "amount", "type", "merchant", "category", "categoryIcon"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["transactions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_transactions" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Error procesando el documento" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiResult));
      return new Response(JSON.stringify({ error: "No se pudieron extraer movimientos" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // Clean up - delete the file from storage
    await supabase.storage.from("statements").remove([filePath]);

    return new Response(JSON.stringify({ transactions: parsed.transactions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-statement error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
