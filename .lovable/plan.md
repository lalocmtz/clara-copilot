

# Plan: Arreglar bot Telegram + Chat in-app

## Problema actual del bot de Telegram

El bot solo maneja 3 casos: `/ayuda`, `/vincular`, `/resumen`, y parsing de transacciones. Los comandos `/presupuestos`, `/deudas`, `/tarjetas`, `/porcobrar`, `/frascos` que se listan en la UI **no existen en el código**. Preguntas abiertas como "Cuánto he gastado en transporte?" caen al parser de AI que solo extrae transacciones, no responde consultas.

## Cambios

### 1. Reescribir `supabase/functions/telegram-bot/index.ts`

Expandir el bot con dos mejoras grandes:

**a) Implementar los 5 comandos faltantes:**
- `/presupuestos` — consulta budgets del mes actual, muestra categoría, gastado vs presupuestado, % usado
- `/deudas` — consulta tabla `debts` activas, muestra nombre, saldo, pago mínimo
- `/tarjetas` — consulta `credit_cards` activas, muestra nombre, saldo, límite, disponible
- `/porcobrar` — consulta `receivables` pendientes, muestra deudor, monto, fecha
- `/frascos` — consulta `jar_settings` + `income_allocations` del mes

Cada comando hace queries directas a Supabase con el `userId` del usuario vinculado.

**b) Agregar modo "consulta inteligente":**
Cuando el mensaje no es un comando ni se puede parsear como transacción, enviar el mensaje al AI con un system prompt diferente que incluya contexto financiero del usuario (resumen del mes, presupuestos, cuentas) y le pida **responder la pregunta** en lugar de extraer una transacción. Esto permite preguntas como "cuánto gasté en transporte", "cómo van mis presupuestos", etc.

Lógica de decisión del AI:
- El system prompt pide al AI decidir si el mensaje es una transacción o una consulta
- Si es transacción: devuelve JSON con `{action: "transaction", ...datos}`
- Si es consulta: devuelve JSON con `{action: "query", response: "..."}`
- Si no entiende: `{action: "error", response: "..."}`

### 2. Crear edge function `supabase/functions/chat/index.ts`

Edge function para el chat in-app. Recibe mensajes del usuario + historial, consulta datos financieros del usuario autenticado, y responde usando Lovable AI con streaming SSE.

- Valida JWT del usuario con `getClaims()`
- Carga contexto financiero: transacciones del mes, presupuestos, cuentas, tarjetas, deudas
- System prompt en español como "Clara, tu CFO personal"
- Streaming response para UX fluida
- Manejo de errores 429/402

### 3. Crear componente `src/components/ChatAssistant.tsx`

Chat UI integrado en la página de Asistente:
- Input de texto + botón enviar
- Lista de mensajes (usuario/asistente) con scroll automático
- Rendering de markdown en respuestas del AI (react-markdown)
- Streaming token-by-token
- Historial en memoria (no persiste entre sesiones)
- Indicador de "Clara está escribiendo..."

### 4. Actualizar `src/pages/Assistant.tsx`

- Reemplazar la sección de "Capacidades" estática con el componente ChatAssistant como elemento principal
- Mantener la configuración de Telegram y recordatorios debajo
- El chat ocupa la parte superior de la página

### 5. Actualizar `supabase/config.toml`

Agregar la nueva función:
```toml
[functions.chat]
verify_jwt = false
```

## Dependencias

- Instalar `react-markdown` para renderizar respuestas del chat

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/telegram-bot/index.ts` | Reescribir: agregar 5 comandos + modo consulta AI |
| `supabase/functions/chat/index.ts` | Crear: edge function para chat in-app |
| `src/components/ChatAssistant.tsx` | Crear: componente de chat con streaming |
| `src/pages/Assistant.tsx` | Modificar: integrar ChatAssistant |
| `supabase/config.toml` | Agregar función chat |

