
# Conectar transacciones con saldos de cuentas

## Problema actual
Cuando registras un gasto o ingreso y seleccionas una cuenta (ej: "Jai Banco"), la transaccion se guarda pero el saldo de esa cuenta no cambia. No hay conexion real entre transacciones y cuentas.

## Solucion
Cada vez que se cree, edite o elimine una transaccion, el saldo de la cuenta asociada se actualizara automaticamente en la base de datos y en la interfaz.

### Logica de impacto en saldo:
- **Gasto**: resta el monto del saldo de la cuenta
- **Ingreso**: suma el monto al saldo de la cuenta
- **Editar transaccion**: revierte el impacto anterior y aplica el nuevo
- **Eliminar transaccion**: revierte el impacto de la transaccion eliminada

## Cambios tecnicos

### 1. `src/context/AppContext.tsx` - Funcion `addTransaction`
Despues de insertar la transaccion exitosamente:
- Buscar la cuenta por nombre en el estado local
- Calcular el delta: `+amount` si es ingreso, `-amount` si es gasto
- Actualizar el saldo en la base de datos con `supabase.from("accounts").update({ balance: newBalance })`
- Actualizar el estado local de cuentas con el nuevo saldo

### 2. `src/context/AppContext.tsx` - Funcion `updateTransaction`
Antes de guardar los cambios:
- Obtener la transaccion original del estado
- Revertir el impacto anterior: si era gasto, sumar el monto viejo a la cuenta vieja; si era ingreso, restar
- Aplicar el nuevo impacto: con el nuevo tipo, monto y cuenta
- Si la cuenta cambio (ej: mover de BBVA a Nu), actualizar ambas cuentas
- Guardar ambos saldos en la base de datos

### 3. `src/context/AppContext.tsx` - Funcion `deleteTransaction`
Antes de eliminar:
- Obtener la transaccion del estado
- Revertir su impacto: si era gasto, sumar el monto de vuelta; si era ingreso, restar
- Actualizar saldo en base de datos y estado local

### 4. `src/components/QuickAddTransaction.tsx` - Sin cambios estructurales
Ya envia el nombre de la cuenta. La logica nueva vive en el contexto.

### 5. `src/components/TransactionEditor.tsx` - Sin cambios estructurales
Ya permite cambiar cuenta, tipo y monto. La logica de reversion/aplicacion vive en el contexto.

## Ejemplo de flujo
1. Cuenta "BBVA Debito" tiene saldo $45,200
2. Registras un gasto de $500 en "BBVA Debito"
3. El sistema guarda la transaccion Y actualiza BBVA Debito a $44,700
4. Si editas ese gasto a $300, el sistema revierte los $500 (+$500) y aplica -$300, quedando $44,900
5. Si eliminas la transaccion, el sistema suma de vuelta los $300, quedando $45,200

## Notas
- Las transacciones se vinculan a cuentas por nombre (campo `account`), que es como ya funciona el sistema actual
- Para tarjetas de credito (saldo negativo), un gasto hace el saldo mas negativo y un pago/ingreso lo acerca a cero
- No se requieren cambios en la base de datos, solo en la logica del contexto
