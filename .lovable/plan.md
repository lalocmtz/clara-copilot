

# Clara: Evolución a sistema financiero personal

## Estado: ✅ FASE 1 IMPLEMENTADA

### Cambios realizados:

#### Base de datos (9 tablas nuevas + columnas en 3 existentes)
- **credit_cards**: Tarjetas con límite, utilización, semáforo de riesgo
- **debts**: Deudas con estrategia snowball/avalanche
- **receivables**: Cuentas por cobrar con recordatorios
- **income_allocations** + **jar_settings**: Método T. Harv Eker (6 frascos)
- **assistant_memory**: Memoria financiera del asistente
- **reminders**: Recordatorios configurables por Telegram
- **user_financial_preferences**: Meta de ingresos, tono, estrategia
- **attachments**: Archivos procesados (OCR-ready)
- Columnas nuevas en transactions (source, credit_card_id, debt_id, etc.)
- Columnas nuevas en accounts (institution, available_balance, active)
- Columnas nuevas en categories (parent_id, color, default_budget)

#### Arquitectura de servicios (src/services/)
- credit-cards.ts, debts.ts, receivables.ts, allocations.ts, preferences.ts
- React Query hooks para cada dominio

#### Nuevas páginas
- /cards — Tarjetas con semáforo de riesgo
- /debts — Deudas con snowball vs avalanche
- /receivables — Mini CRM de por cobrar
- /income — Ingresos + frascos Eker + meta mensual
- /assistant — Centro de control Telegram

#### Navegación actualizada
- 11 secciones: Panorama, Movimientos, Presupuestos, Ingresos, Deudas, Tarjetas, Cuentas, Por cobrar, Suscripciones, Asistente, Insights

#### Panorama rediseñado (3 zonas)
1. Estado general: capital, ingresos/gastos, flujo neto, meta, presupuesto
2. Focos de riesgo: tarjetas peligrosas, presupuestos pasados, por cobrar
3. Acciones sugeridas: cards accionables con contexto real

### Pendiente (Fase 2):
- Edge functions: budget-status-engine, income-allocation-engine, assistant-reminders
- Refactor Telegram webhook con clasificación de intención
- OCR receipts, debt simulator, daily digest
