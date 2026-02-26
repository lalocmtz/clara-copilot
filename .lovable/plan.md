
# Clara — Estado Global y CRUD Completo

## ✅ IMPLEMENTADO

### AppContext centralizado (`src/context/AppContext.tsx`)
- Estado global: transactions, accounts, budgets, subscriptions, investments, categories
- CRUD completo para todas las colecciones
- Valores computados: monthlyTotals, topCategories (derivados con useMemo)
- resetAll() para restablecer datos demo

### Modales de edición
- `TransactionEditor.tsx` — editar/eliminar transacciones (click en cualquier movimiento)
- `AccountEditor.tsx` — agregar/editar/eliminar cuentas
- `SubscriptionEditor.tsx` — agregar/editar/eliminar suscripciones

### Páginas conectadas al contexto
- **Index.tsx** — todo derivado del contexto, click en movimientos abre editor
- **Transactions.tsx** — click en transacción abre editor
- **Budgets.tsx** — presupuesto por categoría editable inline (click en monto)
- **Accounts.tsx** — botón "Agregar", click en cuenta abre editor
- **Subscriptions.tsx** — botón "Agregar", click en suscripción abre editor
- **Insights.tsx** — insights dinámicos calculados del contexto

### QuickAddTransaction conectado
- Llama addTransaction() del contexto al guardar
- Lee categorías y cuentas del contexto

### CategoryManager conectado
- Lee/escribe categorías del contexto

### Botón "Restablecer demo"
- En sidebar (Layout), botón RefreshCw que llama resetAll()
- Toast de confirmación

---

## Siguiente paso sugerido
- Conectar Lovable Cloud para persistencia real (base de datos + auth)
