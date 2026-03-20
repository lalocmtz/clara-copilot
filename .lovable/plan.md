

# Plan: Drill-down de transacciones por categoría en Presupuestos

## Que se va a hacer

Al hacer clic en una fila de categoría en la tabla de presupuestos, se expandirá un panel debajo de esa fila mostrando todas las transacciones de esa categoría en el mes seleccionado. Incluirá fecha, comercio/nota, cuenta y monto. Se puede cerrar haciendo clic de nuevo.

## Cambios

### `src/pages/Budgets.tsx`

1. Agregar estado `expandedCategory: string | null` para trackear qué categoría está expandida.
2. Obtener `transactions` desde `useAppData()`.
3. En cada fila de presupuesto, hacer la fila clickeable para toggle `expandedCategory`.
4. Si la categoría está expandida, renderizar debajo una lista de transacciones filtradas por:
   - `t.type === 'expense'`
   - `t.date.startsWith(selectedPeriod)`
   - `t.category === b.category || t.category === icon + ' ' + b.category` (misma lógica de match que ya existe en AppContext)
5. Cada transacción muestra: fecha, comercio/nota, cuenta y monto formateado.
6. Indicador visual (chevron o highlight) para mostrar que la fila es expandible.

No se necesitan cambios en backend ni en otros archivos.

