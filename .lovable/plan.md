
# Transferencias entre cuentas

## Resumen
Agregar "Transferencia" como tercer tipo de movimiento en toda la app. Una transferencia mueve dinero de una cuenta origen a una cuenta destino sin contabilizarse como ingreso ni gasto en los totales mensuales.

## Flujo del usuario
1. Al registrar un movimiento (QuickAddTransaction) o editar uno (TransactionEditor), aparece una tercera opcion: "Gasto | Ingreso | Transferencia"
2. Al seleccionar "Transferencia", desaparece el selector de categoria y aparece un segundo selector de cuenta: "Cuenta destino"
3. La cuenta origen pierde el monto, la cuenta destino lo gana
4. En la lista de transacciones aparece con un icono/badge distinto ("Transferencia") y un filtro adicional
5. Las transferencias NO se suman a ingresos ni gastos en los totales mensuales ni en los presupuestos

## Cambios tecnicos

### 1. Tipo Transaction (`src/lib/mock-data.ts`)
- Cambiar `type: 'expense' | 'income'` a `type: 'expense' | 'income' | 'transfer'`
- Agregar campo opcional `toAccount?: string` para la cuenta destino en transferencias

### 2. Contexto (`src/context/AppContext.tsx`)
- `addTransaction`: cuando `type === 'transfer'`, restar de `account` (origen) y sumar a `toAccount` (destino). No afectar presupuestos
- `updateTransaction`: manejar el caso de cambiar de/a tipo transfer, revirtiendo y aplicando impactos correctamente
- `deleteTransaction`: si era transfer, revertir ambos saldos
- `monthlyTotals`: filtrar para excluir transfers del calculo
- `topCategories`: excluir transfers

### 3. QuickAddTransaction (`src/components/QuickAddTransaction.tsx`)
- Agregar boton "Transferencia" al toggle de tipo (3 opciones)
- Cuando type es `transfer`: ocultar selector de categoria, mostrar selector de "Cuenta destino" (segunda cuenta, distinta a la origen)
- El signo cambia a icono de flechas bidireccionales
- Guardar con `toAccount` cuando es transfer

### 4. TransactionEditor (`src/components/TransactionEditor.tsx`)
- Mismos cambios que QuickAddTransaction: toggle de 3 opciones, campo toAccount condicional
- Manejar edicion de tipo (cambiar de expense a transfer y viceversa)

### 5. Pagina Transacciones (`src/pages/Transactions.tsx`)
- Agregar filtro "Transferencias" junto a "Todos", "Gastos", "Ingresos"
- Mostrar transferencias con icono de flechas y texto "De [origen] a [destino]"
- No sumar transfers al total mostrado

### 6. Base de datos
- Agregar columna `to_account` (text, nullable) a la tabla `transactions` via migracion SQL
- No se necesitan cambios de RLS (la politica existente cubre todo)

### 7. Edge function parse-statement
- Ya soporta tipo `transfer` desde la mejora anterior, solo verificar que el campo `toAccount` se mapee correctamente si la IA lo detecta

### 8. Pagina principal (`src/pages/Index.tsx`)
- Los totales mensuales ya filtran por `income`/`expense`, las transfers quedan excluidas naturalmente
- Mostrar transferencias en la actividad reciente con su badge distintivo

## Archivos a crear/modificar
- Migracion SQL: agregar columna `to_account` a `transactions`
- `src/lib/mock-data.ts`: actualizar tipo Transaction
- `src/context/AppContext.tsx`: logica de transferencias en CRUD y calculos
- `src/components/QuickAddTransaction.tsx`: UI de 3 tipos + cuenta destino
- `src/components/TransactionEditor.tsx`: UI de 3 tipos + cuenta destino
- `src/pages/Transactions.tsx`: filtro y visualizacion de transfers
- `src/components/StatementImporter.tsx`: mapear toAccount si viene del parser
