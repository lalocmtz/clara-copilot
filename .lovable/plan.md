

# Unificacion de tarjetas de credito como fuente unica de verdad

## Resumen

Actualmente las tarjetas de credito pueden existir duplicadas en tres lugares: `accounts` (tipo `credit`), `credit_cards`, y potencialmente `debts` (tipo `credit_card`). Esto genera doble conteo en el dashboard y confusion conceptual. El cambio establece `credit_cards` como fuente unica y elimina la redundancia.

---

## Cambios de base de datos

### Migracion
- Agregar columna `notes` (text, nullable) a `credit_cards` si no existe
- Agregar columna `linked_debit_account_id` como FK nullable a accounts
- Crear vista SQL `debt_obligations_view` que unifica `credit_cards` y `debts` en un modelo homogeneo para el motor de estrategia:

```text
SELECT id as obligation_id, 'credit_card' as source, user_id, name, bank as creditor,
       current_balance, apr, minimum_payment, due_day, available_credit, 
       no_interest_payment, active
FROM credit_cards
UNION ALL
SELECT id, 'debt', user_id, name, creditor, current_balance, apr, minimum_payment, 
       due_day, NULL, NULL, active
FROM debts
```

- No se eliminan datos de `accounts` tipo `credit` para no romper historicos, pero se deja de usar esa clasificacion para metricas financieras.

---

## Servicios frontend

### Nuevo: `src/services/financial-position.ts`
Hook `useFinancialPosition` que calcula:
- `realLiquidity`: suma de accounts tipo cash/debit/savings/checking
- `savingsTotal`: accounts tipo savings
- `investmentTotal`: suma de investments
- `totalCreditLimit`: suma de credit_cards.credit_limit
- `totalCreditUsed`: suma de credit_cards.current_balance
- `totalCreditAvailable`: limit - used
- `totalCardDebt`: = totalCreditUsed
- `totalNonCardDebt`: suma de debts.current_balance
- `totalDebt`: card + non-card
- `immediateCapacity`: realLiquidity + totalCreditAvailable

Consume datos de `useCreditCards()`, `useDebts()`, accounts e investments del AppContext.

### Actualizar: `src/services/credit-cards.ts`
- Agregar funcion `getCardRiskMetrics(card)` que devuelve: utilization, days_to_closing, days_to_due, risk_level
- Mantener hooks existentes intactos

### Actualizar: `src/services/debts.ts`
- Agregar tipo `DebtObligation` unificado
- Agregar `useUnifiedObligations()` hook que combina credit_cards + debts en una lista comun para estrategia snowball/avalanche
- Funciones `snowballOrder` y `avalancheOrder` operan sobre `DebtObligation[]`

---

## Cambios en paginas

### `src/pages/Accounts.tsx` — Posicion financiera
Reestructurar en 4 bloques claros:
1. **Liquidez real** — solo checking/savings/cash (etiqueta: "Lo que si tienes hoy")
2. **Inversiones** — inversiones existentes
3. **Credito disponible** — resumen agregado de credit_cards (total limite, usado, disponible). Lista resumida de tarjetas sin duplicar la vista operativa de /cards. Etiqueta: "Lo que podrias usar, pero te endeuda"
4. **Pasivos** — deuda tarjetas total + deuda no tarjeta total

Metricas de resumen arriba: Liquidez real, Credito disponible (secundario), Deuda total.
Eliminar la seccion actual que lista tarjetas como accounts tipo `credit`.
Leer tarjetas desde `useCreditCards()` para el bloque 3.

### `src/pages/Cards.tsx` — Centro operativo de tarjetas
Mantener estructura actual pero agregar:
- CTA "Actualizar estado" por tarjeta (abre el editor con foco en snapshot)
- CTA "Registrar pago" (abre quick add con tipo `credit_card_payment` preseleccionado)
- Bloque de pagos por tarjeta (minimo, sin intereses)
- Mejorar el editor para incluir campo `notes`

### `src/pages/Debts.tsx` — Vista estrategica unificada
Reestructurar en 3 secciones:
1. **Resumen total**: deuda tarjetas | deuda no tarjeta | deuda total
2. **Selector de estrategia**: avalanche/snowball (ya existe)
3. **Lista de prioridades unificada**: usa `useUnifiedObligations()` para mostrar tarjetas Y deudas ordenadas por estrategia, con badge de fuente ("Tarjeta" / "Prestamo")

El formulario de "Agregar deuda" solo crea en tabla `debts`. Las tarjetas se gestionan desde /cards.

### `src/pages/Index.tsx` — Panorama
Reemplazar calculo actual de `capitalTotal` para usar `useFinancialPosition()`:
- Mostrar: Liquidez real, Credito disponible (badge secundario), Deuda tarjetas, Deuda no tarjeta
- Eliminar doble conteo de accounts.credit + creditCards
- Etiquetas claras: "Liquidez real: lo que si tienes", "Capacidad inmediata: colchon total"

### `src/components/AccountEditor.tsx`
- Eliminar tipo `credit` del selector de tipo de cuenta (las tarjetas se crean en /cards)
- Mantener tipos: checking, savings, debt
- El tipo `debt` en accounts queda para deudas informales simples; las deudas formales van a /debts

### `src/components/QuickAddTransaction.tsx`
- Agregar tipo de transaccion `credit_card_payment`
- Cuando se selecciona, mostrar selector de tarjeta (de credit_cards) y cuenta origen
- Al guardar: disminuir saldo en cuenta origen Y disminuir current_balance de la tarjeta seleccionada via `useCreditCardMutations().update`

### `src/lib/mock-data.ts`
- Eliminar la cuenta demo AMEX tipo `credit` del seed (se creara como credit_card en su lugar)
- O mantenerla pero marcarla para no aparecer en liquidez

---

## Logica de movimientos con tarjeta

### Compra con tarjeta
Cuando `addTransaction` recibe un gasto con `credit_card_id`:
- Se registra como gasto normal en la categoria correspondiente
- Se actualiza `current_balance` de la tarjeta (+monto)
- NO se afecta ninguna cuenta de liquidez

### Pago de tarjeta (`credit_card_payment`)
- Se registra como tipo `credit_card_payment` (no gasto)
- Se resta de la cuenta origen (liquidez)
- Se resta del `current_balance` de la tarjeta
- NO aparece como gasto en presupuestos

---

## Orden de implementacion

1. Migracion DB (notes en credit_cards, vista unificada)
2. `financial-position.ts` service
3. Actualizar `debts.ts` con obligaciones unificadas
4. Refactorizar `Accounts.tsx` con 4 bloques
5. Refactorizar `Debts.tsx` con vista estrategica unificada
6. Actualizar `Index.tsx` panorama con posicion financiera correcta
7. Mejorar `Cards.tsx` con CTAs
8. Actualizar `QuickAddTransaction` con credit_card_payment
9. Limpiar `AccountEditor` (quitar tipo credit)

