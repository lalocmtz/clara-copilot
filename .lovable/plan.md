

# Agregar selector de fecha en registro y edicion de movimientos

## Resumen
Actualmente al registrar un movimiento se usa la fecha de hoy automaticamente y no se puede cambiar. Al editar tampoco se puede modificar la fecha. Se agregara un boton de fecha en ambos formularios usando un Popover con Calendar (date picker).

## Cambios

### 1. QuickAddTransaction.tsx
- Agregar estado `date` inicializado con la fecha de hoy (`new Date()`)
- Debajo del monto (o debajo de la moneda MXN), agregar un boton que muestre la fecha seleccionada con un icono de calendario
- Al hacer clic, abrir un Popover con el componente Calendar para elegir otra fecha
- Usar la fecha seleccionada en `handleSave` en lugar de `new Date().toISOString().slice(0, 10)`
- Resetear la fecha a hoy al cerrar el modal

### 2. TransactionEditor.tsx
- Agregar estado `date` inicializado desde `transaction.date`
- Mostrar el mismo boton de fecha (con Popover + Calendar) entre el monto y la categoria
- Al guardar, incluir `date` en el objeto que se pasa a `updateTransaction`

### Componentes utilizados
- `Popover` y `PopoverTrigger` / `PopoverContent` de shadcn (ya instalados)
- `Calendar` de shadcn (ya existe en el proyecto)
- `format` de `date-fns` (ya instalado)
- Icono `CalendarIcon` de `lucide-react`

### Estilo visual
- Boton con fondo `bg-secondary`, texto `text-foreground`, mismo estilo que los demas campos
- Muestra la fecha formateada en espanol (ej: "26 feb 2026")
- El calendario se abre en un popover centrado, con `pointer-events-auto` para que funcione dentro del modal

