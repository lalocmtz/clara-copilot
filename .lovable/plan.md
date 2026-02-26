

# Sistema de prioridad de saldos y reconciliacion de estados de cuenta

## Resumen

Actualmente, cada transaccion que se registra (manual o importada) modifica automaticamente el saldo de la cuenta. El usuario necesita que:

1. **Los saldos manuales sean la fuente de verdad** - lo que el usuario ingresa como saldo es lo real
2. **Las importaciones pasadas no afecten saldos** - son registro historico
3. **Las importaciones futuras sirvan para reconciliar** - detectar gastos faltantes, no duplicar
4. **Los movimientos dudosos queden como "pendientes"** para revision manual
5. **Se registre cuando se actualizo el saldo por ultima vez**

---

## Cambios

### 1. Base de datos

**Tabla `accounts`** - agregar columna:
- `balance_updated_at` (timestamptz, default now()) - registra la ultima vez que el usuario actualizo manualmente el saldo

**Tabla `transactions`** - agregar columna:
- `status` (text, default 'confirmed') - valores: `confirmed`, `pending`
  - `confirmed`: movimiento validado, impacta saldo normalmente
  - `pending`: movimiento importado con discrepancia, requiere revision manual

### 2. Logica de saldos en AppContext

**Cambio principal**: `addTransaction` recibira un parametro opcional `skipBalanceUpdate` (default false).

- Cuando el usuario registra un gasto/ingreso manualmente desde hoy en adelante: impacta saldo normalmente (`skipBalanceUpdate = false`)
- Cuando se importan transacciones desde el StatementImporter: se usa `skipBalanceUpdate = true`, es decir, se guardan como registro historico sin modificar saldos

**`updateAccount`**: cuando el usuario edita el saldo de una cuenta, se actualiza automaticamente `balance_updated_at` a la fecha/hora actual.

### 3. Reconciliacion inteligente en StatementImporter

Cuando el usuario importa un estado de cuenta, antes de mostrar la vista previa:

1. Se cargan las transacciones existentes del mismo periodo y cuenta
2. Para cada transaccion parseada del estado de cuenta, se busca un "match" entre las existentes:
   - Misma fecha (o +/- 1 dia), mismo monto exacto, merchant similar -> **Duplicado**, se deselecciona automaticamente y se marca como "Ya registrado"
   - Misma fecha, mismo merchant pero monto ligeramente diferente (diferencia < 5%) -> **Discrepancia**, se marca como "Pendiente" con badge amarillo. El usuario decide si actualizar el monto existente o ignorar
   - Sin match -> **Nuevo**, se selecciona normalmente pero se importa con status `pending` para que el usuario lo confirme

3. En la UI de preview se agregan badges:
   - "Ya registrado" (gris, deseleccionado) - duplicado exacto
   - "Pendiente" (amarillo) - discrepancia o movimiento nuevo sin match
   - "Nuevo" (azul) - movimiento sin match alguno

4. Los movimientos importados se guardan con `skipBalanceUpdate = true` y `status = 'pending'` (los nuevos) o `status = 'confirmed'` (los que el usuario explicitamente selecciona)

### 4. UI de transacciones pendientes

En la pagina de Transacciones:
- Las transacciones con `status = 'pending'` se muestran con un badge "Pendiente" y fondo ligeramente diferente
- Al hacer clic en una pendiente, en el editor aparece un boton "Confirmar" que cambia su status a `confirmed`
- Un filtro adicional de burbujas para ver solo "Pendientes" o "Confirmados"

### 5. Fecha de ultima actualizacion en cuentas

En la pagina de Cuentas, debajo de cada cuenta, mostrar "Actualizado: hace 2 horas" o "Actualizado: 26 feb 2026" con la fecha de `balance_updated_at`.

---

## Detalle tecnico

### Migracion SQL
```text
ALTER TABLE accounts ADD COLUMN balance_updated_at timestamptz DEFAULT now();
ALTER TABLE transactions ADD COLUMN status text NOT NULL DEFAULT 'confirmed';
```

### AppContext - addTransaction modificado
- Nuevo parametro en la interfaz: `addTransaction(t, options?: { skipBalanceUpdate?: boolean })`
- Si `skipBalanceUpdate` es true, se inserta la transaccion pero no se llama `updateAccountBalance`

### AppContext - updateAccount modificado
- Al actualizar el balance, se incluye `balance_updated_at: new Date().toISOString()` en el update a la DB

### StatementImporter - Flujo de reconciliacion
```text
1. Usuario sube archivo
2. IA parsea transacciones
3. NUEVO: Se consultan transacciones existentes del periodo
4. NUEVO: Se compara cada tx parseada vs existentes
5. Se marca cada tx como: duplicada / discrepancia / nueva
6. Vista previa muestra badges de estado
7. Al confirmar, se importan con skipBalanceUpdate=true
8. Movimientos nuevos entran como status='pending'
```

### Transaction interface - campo nuevo
- Agregar `status?: 'confirmed' | 'pending'` a la interfaz Transaction en mock-data.ts
- Mapear en AppContext al cargar datos

### Archivos a modificar
1. `supabase/migrations/` - nueva migracion
2. `src/lib/mock-data.ts` - agregar `status` a Transaction interface
3. `src/context/AppContext.tsx` - logica de skipBalanceUpdate, mapeo de status, balance_updated_at
4. `src/components/StatementImporter.tsx` - reconciliacion, badges, importar sin impactar saldo
5. `src/pages/Transactions.tsx` - badge de pendiente, filtro de status
6. `src/components/TransactionEditor.tsx` - boton "Confirmar" para pendientes
7. `src/pages/Accounts.tsx` - mostrar fecha de ultima actualizacion
8. `src/components/AccountEditor.tsx` - actualizar balance_updated_at al guardar
9. `src/integrations/supabase/types.ts` - se actualiza automaticamente

