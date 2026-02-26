
# Historico de estados de cuenta importados

## Resumen
Crear un registro de cada estado de cuenta importado para que el usuario pueda ver que archivos ha cargado, a que cuenta, cuantos movimientos se importaron, y de que periodo son las transacciones.

## Cambios

### 1. Nueva tabla `statement_imports` en la base de datos
Campos:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `file_name` (text) - nombre original del archivo (ej: "Estado de cuenta Liverpool.pdf")
- `account_name` (text) - cuenta a la que se asignaron los movimientos
- `transactions_count` (integer) - cuantos movimientos se importaron
- `period_start` (date) - fecha mas antigua de los movimientos
- `period_end` (date) - fecha mas reciente de los movimientos
- `created_at` (timestamptz, default now())

Con RLS: usuarios solo ven sus propios registros.

### 2. Actualizar `StatementImporter.tsx`
En `handleConfirm`, despues de importar los movimientos exitosamente, insertar un registro en `statement_imports` con:
- El nombre del archivo original (`file.name`)
- La cuenta seleccionada
- La cantidad de movimientos importados
- Las fechas min/max de las transacciones seleccionadas

### 3. Mostrar historial en la pagina de Transacciones
Agregar un boton "Historial" (icono History) junto al boton "Importar" en `Transactions.tsx`. Al presionarlo, abre un dialog/sheet que lista los imports previos:
- Nombre del archivo
- Cuenta
- Periodo (ej: "Ene 2026 - Feb 2026")  
- Cantidad de movimientos
- Fecha en que se cargo

La lista se obtiene directamente de la tabla `statement_imports` ordenada por `created_at` desc.

### Detalle tecnico
- Crear migracion SQL para la tabla con RLS
- No se necesitan cambios en AppContext (la consulta se hace directamente en el componente del historial)
- Nuevo componente `StatementHistory.tsx` con un Dialog que muestra la lista
