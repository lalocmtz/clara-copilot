

# Clara: Evolucion a sistema financiero personal — Plan de implementacion

## Alcance y realidad

Este es un proyecto de producto completo que normalmente toma meses. Lo estructuro en fases incrementales donde cada una entrega valor real sin romper lo existente. Este plan cubre **Fase 1** con detalle implementable.

---

## Fase 1: Fundaciones (lo que se implementa ahora)

### A. Nuevas tablas de base de datos

Se crean las siguientes tablas con RLS por `user_id`, indices y triggers de `updated_at`:

**credit_cards** — Tarjetas separadas de accounts
- id, user_id, bank, name, last_four, credit_limit, current_balance, statement_balance, available_credit, closing_day, due_day, minimum_payment, no_interest_payment, apr, active, created_at, updated_at

**debts** — Deudas con estrategia
- id, user_id, name, creditor, original_amount, current_balance, apr, minimum_payment, due_day, type (enum), strategy_tag (avalanche/snowball/manual), payoff_priority, notes, active, created_at, updated_at

**receivables** — Por cobrar
- id, user_id, debtor_name, concept, amount_total, amount_paid, due_date, status (enum), reminder_enabled, last_reminder_at, notes, created_at, updated_at

**income_allocations** — Asignaciones por ingreso
- id, user_id, income_transaction_id, jar_type (enum), percentage, amount, created_at

**jar_settings** — Configuracion de frascos Eker
- id, user_id, necessities (default 55), financial_freedom (10), education (10), play (10), long_term_savings (10), give (5), effective_from, created_at, updated_at

**assistant_memory** — Memoria financiera del asistente
- id, user_id, entity_type, entity_id, summary, tags (text[]), memory_type (enum), salience_score, created_at

**reminders** — Recordatorios configurables
- id, user_id, channel, reminder_type, target_entity_type, target_entity_id, schedule_type, schedule_config (jsonb), enabled, last_sent_at, next_run_at, created_at, updated_at

**user_financial_preferences** — Preferencias financieras
- id, user_id, monthly_income_goal, preferred_currency, debt_strategy_default, motivational_tone, telegram_daily_digest_enabled, telegram_digest_hour, created_at, updated_at

**attachments** — Archivos procesados
- id, user_id, file_url, mime_type, source, ocr_status, parse_status, ocr_confidence, linked_entity_type, linked_entity_id, created_at

### B. Evolucion de tablas existentes

**transactions** — Nuevos campos (columnas adicionales, no destructivas):
- source (text, default 'manual')
- description (text, nullable)
- credit_card_id (uuid, nullable)
- debt_id (uuid, nullable)
- receivable_id (uuid, nullable)
- parse_confidence (numeric, nullable)
- duplicate_of_transaction_id (uuid, nullable)

Se amplian los valores validos de `type` y `status` via texto (sin enum para flexibilidad).

**categories** — Nuevos campos:
- parent_id (uuid, nullable, self-reference)
- color (text, nullable)
- default_budget (numeric, nullable)

**accounts** — Nuevos campos:
- institution (text, nullable)
- available_balance (numeric, nullable)
- last_statement_balance (numeric, nullable)
- active (boolean, default true)

### C. Arquitectura de servicios frontend

Crear `src/services/` con modulos por dominio que extraen logica de AppContext:

```text
src/services/
  ledger.ts        — CRUD transacciones, calculo de balances
  budgets.ts       — logica de presupuestos, progreso, sugerencias
  credit-cards.ts  — CRUD tarjetas, calculo de utilizacion, semaforo
  debts.ts         — CRUD deudas, snowball/avalanche basico
  receivables.ts   — CRUD por cobrar
  allocations.ts   — logica de frascos Eker
  insights.ts      — calculo de insights, alertas
```

Cada servicio exporta hooks de React Query que reemplazan gradualmente la logica concentrada en AppContext.

### D. Nuevas paginas frontend

1. **Ingresos** (`/income`) — Meta mensual, progreso, historial, distribucion por frascos
2. **Deudas** (`/debts`) — Lista de deudas, estrategia, simulador basico snowball vs avalanche
3. **Tarjetas** (`/cards`) — Tarjetas con semaforo, utilizacion, fechas, recomendacion de pago
4. **Por cobrar** (`/receivables`) — Mini CRM de deudores
5. **Asistente** (`/assistant`) — Centro de control Telegram, memorias, recordatorios, estado de conexion

### E. Rediseno de navegacion

Sidebar actualizado:
- Panorama, Movimientos, Presupuestos, Ingresos, Deudas, Tarjetas, Cuentas, Por cobrar, Suscripciones, Asistente, Insights

### F. Panorama rediseñado

Tres zonas claras:
1. Estado general: net worth, cash disponible, ingresos/gastos del mes, flujo neto
2. Focos de riesgo: tarjetas en riesgo, presupuestos pasados, deudas criticas
3. Acciones sugeridas: cards accionables tipo "Hoy deberias pagar X", "Te quedan Y en comida"

### G. Telegram refactor inicial

Renombrar `telegram-bot` a `telegram-webhook` conceptualmente y ampliar el router para soportar:
- Clasificacion de intencion (create_transaction, query_finances, create_receivable)
- Nuevos comandos: `/deudas`, `/tarjetas`, `/porcobrar`, `/frascos`
- Guardar `source: 'telegram_text'` en transacciones
- Base para memoria (guardar assistant_events)

### H. Edge functions nuevas (Fase 1)

- **budget-status-engine** — Calcula estado de presupuestos para recordatorios
- **income-allocation-engine** — Distribuye ingreso segun jar_settings
- **assistant-reminders** — Envia recordatorios diarios por Telegram (cron-ready)

---

## Fases posteriores (diseñadas pero no implementadas ahora)

**Fase 2**: OCR receipts, conciliacion mejorada, debt simulator avanzado, daily digest Telegram, seguimiento meta ingresos
**Fase 3**: Insights automaticos, recomendaciones proactivas, motivacion contextual, personalizacion del asistente

---

## Orden de implementacion

1. Migracion de base de datos (todas las tablas nuevas + columnas adicionales)
2. Servicios frontend (`src/services/`)
3. Nuevas paginas: Tarjetas, Deudas, Por cobrar, Ingresos, Asistente
4. Rediseno de navegacion y Panorama
5. Edge functions nuevas
6. Refactor Telegram webhook

---

## Restricciones respetadas

- No se rompe nada existente — solo se agregan columnas y tablas
- Se mantiene React + Vite + TS + Tailwind + shadcn
- RLS en todas las tablas nuevas
- Triggers de updated_at donde aplique
- Mobile-first en todo el frontend
- AppContext se mantiene funcionando pero se empieza a desacoplar

