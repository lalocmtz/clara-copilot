
# Tres mejoras: importador inteligente, deteccion de suscripciones, y navegacion por mes

## 1. Importador inteligente de estados de cuenta (evitar duplicados)

### Problema
Al importar un estado de cuenta de tarjeta de credito, los pagos recibidos (abonos a la tarjeta) aparecen como "ingresos", duplicando el dinero que ya se registro como salario en otra cuenta.

### Solucion
Modificar el prompt de la IA en la edge function `parse-statement` para que clasifique cada movimiento en tres tipos en lugar de dos:
- `expense` -- gasto real (compras, servicios, etc.)
- `income` -- ingreso real (nomina, freelance, etc.)
- `transfer` -- movimiento interno (pago a tarjeta, transferencia entre cuentas propias)

En la UI del `StatementImporter`, los movimientos tipo `transfer` vendran **deseleccionados por defecto** y se mostraran con una etiqueta visual distinta (badge "Transferencia") para que el usuario pueda revisarlos. Los gastos vienen seleccionados. Los ingresos tambien vienen seleccionados pero con aviso visual.

Ademas, la IA tambien marcara si detecta que un movimiento parece ser una suscripcion recurrente (campo `isSubscription` + `subscriptionName`).

### Archivos a modificar
- `supabase/functions/parse-statement/index.ts` -- actualizar prompt y schema del tool calling para incluir `transfer` y `isSubscription`
- `src/components/StatementImporter.tsx` -- manejar tipo `transfer`, deseleccionarlos por defecto, mostrar badges, y boton de "Agregar a suscripciones"

## 2. Deteccion de suscripciones desde el importador

### Solucion
Cuando la IA detecte un movimiento que parece suscripcion (Netflix, Spotify, gimnasio, seguro, etc.), lo marcara con `isSubscription: true` y `subscriptionName`.

En la vista previa del importador, estos movimientos tendran un boton/icono "Agregar a suscripciones" que abre un mini-formulario pre-llenado con nombre, monto y categoria para registrarlo como suscripcion recurrente usando `addSubscription`.

### Archivos a modificar
- `supabase/functions/parse-statement/index.ts` -- ya cubierto arriba
- `src/components/StatementImporter.tsx` -- agregar boton de suscripcion por fila y logica para llamar `addSubscription`

## 3. Navegacion por mes en la pagina principal

### Problema
La pagina principal solo muestra datos del mes actual sin posibilidad de ver meses anteriores.

### Solucion
Agregar un selector de mes con flechas izquierda/derecha en el encabezado de la pagina principal ("< Febrero 2026 >"). Al cambiar de mes:
- Filtrar transacciones por el mes seleccionado
- Recalcular totales de ingresos/gastos del mes
- Recalcular presupuesto del mes
- Recalcular top categorias del mes
- Los datos de capital total y pagos proximos se mantienen sin filtro (son datos actuales)

Actualmente `monthlyTotals` y `topCategories` se calculan en `AppContext` sin filtro de mes. La solucion es calcularlos localmente en `Index.tsx` basandose en el mes seleccionado, usando las transacciones ya cargadas.

### Archivos a modificar
- `src/pages/Index.tsx` -- agregar estado `selectedMonth`, flechas de navegacion, y filtrado local de transacciones por mes
- `src/context/AppContext.tsx` -- modificar la query de transacciones para traer todos los meses (no solo el actual) si no lo hace ya. Actualmente ya trae todas sin filtro de fecha, asi que no se necesita cambio aqui.

---

## Resumen tecnico de cambios

### `supabase/functions/parse-statement/index.ts`
- Actualizar el system prompt para instruir a la IA a clasificar movimientos en `expense`, `income`, o `transfer`
- Agregar campos `isSubscription` (boolean) y `subscriptionName` (string) al schema del tool calling
- La IA debe identificar pagos a tarjeta, transferencias entre cuentas propias, y pagos de servicios recurrentes

### `src/components/StatementImporter.tsx`
- Actualizar `ParsedTransaction` para incluir `type: "expense" | "income" | "transfer"`, `isSubscription`, `subscriptionName`
- Las transferencias vienen deseleccionadas por defecto
- Mostrar badges de color por tipo: gasto (normal), ingreso (verde), transferencia (gris/amarillo)
- Para movimientos con `isSubscription`, mostrar un boton con icono de "+" que llama a `addSubscription` con los datos pre-llenados
- Mostrar toast de confirmacion al agregar suscripcion

### `src/pages/Index.tsx`
- Agregar estado `selectedMonth` (formato "YYYY-MM", default mes actual)
- Agregar flechas `ChevronLeft` / `ChevronRight` junto al titulo del mes
- Filtrar `transactions` por `selectedMonth` para calcular totales, categorias, y movimientos recientes del mes
- El titulo cambia dinamicamente ("Enero 2026", "Febrero 2026", etc.)
- Capital total, pagos proximos y presupuestos se quedan con datos actuales
