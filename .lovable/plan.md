
# Navegacion por mes en la pagina de Transacciones

## Problema actual
- La pagina de Transacciones muestra "Febrero 2026" fijo (hardcoded) y lista TODAS las transacciones sin importar su fecha
- No hay forma de navegar entre meses para ver gastos de enero, diciembre, etc.
- Las fechas ya se guardan correctamente al importar estados de cuenta (el importer ya pasa `tx.date` al crear la transaccion)

## Solucion
Agregar un selector de mes con flechas (igual al que ya existe en el Home) para filtrar transacciones por mes.

## Cambios

### `src/pages/Transactions.tsx`
- Agregar estado `currentMonth` (Date) inicializado al mes actual
- Agregar funciones `prevMonth` / `nextMonth` para navegar
- Reemplazar el texto fijo "Febrero 2026" por el mes dinamico formateado (ej: "Febrero 2026", "Enero 2026")
- Agregar flechas de navegacion (ChevronLeft / ChevronRight) igual que en el Home
- Filtrar `transactions` por el mes seleccionado antes de aplicar el filtro de tipo (expense/income/transfer)
- El balance del periodo se recalcula solo con las transacciones del mes visible

### Detalle tecnico
- Usar `format(currentMonth, "MMMM yyyy", { locale: es })` de date-fns para formatear el nombre del mes en espanol
- Filtrar transacciones comparando `tx.date.startsWith("YYYY-MM")` donde YYYY-MM viene de `format(currentMonth, "yyyy-MM")`
- El flujo es: todas las transacciones -> filtrar por mes -> filtrar por tipo -> mostrar lista y calcular balance

### Que NO cambia
- El importador de estados de cuenta ya guarda las fechas correctamente
- La estructura de datos y la base de datos no necesitan cambios
- Los filtros de tipo (Todos/Gastos/Ingresos/Transferencias) siguen funcionando igual, aplicados despues del filtro de mes
