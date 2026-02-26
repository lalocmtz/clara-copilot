

# Clara — Estado Global y CRUD Completo

## El Problema

Actualmente toda la data es estatica importada de `mock-data.ts`. Cada pagina tiene su propio `useState` local sin conexion entre si. Nada persiste, nada se puede editar de verdad.

## Solucion: React Context como Estado Global

Crear un `AppContext` centralizado que maneje todas las colecciones (transacciones, cuentas, presupuestos, suscripciones, inversiones, categorias) con funciones CRUD. Todos los componentes leen y escriben a traves de este contexto.

---

## Archivos Nuevos

### 1. `src/context/AppContext.tsx`
- Context con Provider que inicializa con datos demo
- Estado: transactions, accounts, budgets, subscriptions, investments, categories
- Funciones expuestas:
  - `addTransaction`, `updateTransaction`, `deleteTransaction`
  - `addAccount`, `updateAccount`, `deleteAccount`
  - `updateBudget` (editar monto presupuestado por categoria)
  - `addSubscription`, `updateSubscription`, `deleteSubscription`
  - `resetAll()` — restablece todo a datos demo originales
- Hook `useAppData()` para consumir

### 2. `src/components/TransactionEditor.tsx`
- Modal reutilizable para editar/eliminar una transaccion existente
- Campos: tipo, monto, categoria, cuenta, notas, merchant
- Boton eliminar con confirmacion
- Se abre al hacer click en cualquier transaccion (en Transactions y en Home)

### 3. `src/components/AccountEditor.tsx`
- Modal para agregar o editar cuenta
- Campos: nombre, tipo (debito/ahorro/credito), balance, limite, corte, pago
- Boton eliminar

### 4. `src/components/SubscriptionEditor.tsx`
- Modal para agregar o editar suscripcion
- Campos: nombre, monto, frecuencia, proxima fecha
- Boton eliminar

---

## Archivos a Modificar

### `src/App.tsx`
- Envolver todo en `<AppProvider>`

### `src/pages/Transactions.tsx`
- Leer de `useAppData()` en vez de import directo
- Click en transaccion abre `TransactionEditor`
- Recalcular totales dinamicamente

### `src/pages/Index.tsx`
- Leer de `useAppData()` 
- Click en "ultimos movimientos" abre editor
- Todos los calculos (capital total, flujo, pagos proximos) se derivan del contexto

### `src/pages/Budgets.tsx`
- Leer de `useAppData()`
- Click en presupuesto de cada categoria permite editar el monto (inline o modal)
- El presupuesto global editable ya existe, conectarlo al contexto

### `src/pages/Accounts.tsx`
- Leer de `useAppData()`
- Boton "Agregar cuenta" arriba
- Click en cada cuenta abre `AccountEditor` para editar balance, datos
- Click en inversion permite editar valor actual

### `src/pages/Subscriptions.tsx`
- Leer de `useAppData()`
- Boton "Agregar suscripcion" arriba
- Click en suscripcion abre `SubscriptionEditor`
- Toggle pagado ya funciona, conectar al contexto

### `src/pages/Insights.tsx`
- Leer de `useAppData()` para calcular insights dinamicamente en vez de texto hardcoded

### `src/components/QuickAddTransaction.tsx`
- Llamar `addTransaction()` del contexto al guardar (en vez de solo mostrar confirmacion)

### `src/components/CategoryManager.tsx`
- Conectar al contexto para que los cambios persistan entre paginas

---

## Boton "Restablecer datos demo"

- En el menu lateral (Layout), agregar un boton discreto "Restablecer demo"
- Llama `resetAll()` del contexto
- Muestra toast de confirmacion

---

## Flujo del Usuario Despues de los Cambios

1. **Registrar gasto/ingreso**: FAB o Quick Action en Home -> se agrega al contexto -> aparece en Transacciones y afecta calculos del Home
2. **Editar transaccion**: Click en cualquier movimiento -> modal de edicion -> cambiar categoria, monto, cuenta, o eliminar
3. **Editar presupuesto**: En Budgets, click en monto presupuestado de cada categoria -> editar inline -> se recalcula "te queda"
4. **Agregar cuenta**: En Accounts, boton "Agregar" -> modal -> nueva cuenta aparece en todas partes
5. **Agregar suscripcion**: En Subscriptions, boton "Agregar" -> modal -> aparece en pagos proximos del Home
6. **Restablecer**: Boton en sidebar -> todo vuelve a datos demo iniciales

---

## Detalles Tecnicos

- El estado vive en React Context (sin backend por ahora)
- Se pierde al recargar la pagina (comportamiento esperado hasta conectar Lovable Cloud)
- Los datos mock de `mock-data.ts` se mantienen como "factory defaults" para el reset
- Todas las listas se derivan del contexto: `monthlyTotals`, `topCategories`, etc. se calculan con `useMemo`
- Los modales de edicion siguen el mismo patron visual que QuickAddTransaction (framer-motion, backdrop blur, spring animation)

