
# Agregar "Convertir a suscripcion recurrente" desde el editor de transacciones

## Resumen
Agregar un boton en el editor de transacciones (TransactionEditor) que permita convertir cualquier gasto en una suscripcion recurrente. Al presionarlo, se crea automaticamente una suscripcion con el nombre del comercio, el monto, la categoria, y el dia de cobro extraido de la fecha de la transaccion. La transaccion original permanece intacta en el historial.

## Flujo del usuario
1. El usuario sube un estado de cuenta o registra un gasto manualmente
2. Ve la transaccion en la lista de transacciones y hace click para editarla
3. En el editor aparece un boton "Agregar como suscripcion recurrente" (solo visible para gastos, no para ingresos ni transferencias)
4. Al presionarlo, se crea una suscripcion con:
   - Nombre: el comercio (`merchant`) o la categoria si no hay comercio
   - Monto: el monto de la transaccion
   - Dia de cobro: el dia del mes de la fecha de la transaccion
   - Categoria e icono: los mismos de la transaccion
   - Tipo: "digital" por defecto
   - Frecuencia: "monthly" por defecto
5. Se muestra un toast confirmando: "Netflix agregado a suscripciones"
6. El boton cambia a un estado "ya agregado" (con check verde) para evitar duplicados accidentales
7. La transaccion sigue existiendo como gasto normal

## Cambios tecnicos

### `src/components/TransactionEditor.tsx`
- Importar `addSubscription` desde `useAppData`
- Importar `CalendarPlus`, `Check` de lucide-react y `toast` de sonner
- Agregar estado local `addedAsSub` (boolean, reset en useEffect al abrir)
- Agregar funcion `handleAddSubscription` que:
  - Extrae el dia del mes de `transaction.date`
  - Llama a `addSubscription` con nombre, monto, dia, categoria, icono
  - Muestra toast de exito
  - Cambia `addedAsSub` a true
- Renderizar un boton entre las notas y los botones de accion, solo cuando `type === 'expense'`
- El boton muestra icono CalendarPlus + texto "Agregar como suscripcion recurrente"
- Si ya se agrego, muestra icono Check verde + texto "Agregado a suscripciones" y esta deshabilitado

No se necesitan cambios en la base de datos, contexto, ni otros componentes. La funcionalidad de `addSubscription` ya existe y soporta todos los campos necesarios.
