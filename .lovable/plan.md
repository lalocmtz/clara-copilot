
# Rediseno del Home -- Panel financiero claro y accionable

## Que cambia

El home se reorganiza para responder la pregunta "como estoy financieramente?" en 5 segundos, eliminando redundancias y agregando desglose real del patrimonio.

## Nueva estructura del Home (de arriba a abajo)

### 1. Encabezado con navegacion de mes
Se mantiene igual: "Tu panorama" con flechas para cambiar de mes.

### 2. Capital Total (rediseñado)
El bloque principal muestra el numero grande de Capital Total y debajo un desglose en 5 lineas claras:
- **Liquido**: suma de cuentas checking + savings (dinero disponible en efectivo/debito)
- **Credito disponible**: suma de (creditLimit - |balance|) de tarjetas de credito
- **Invertido**: suma de inversiones
- **Deuda tarjetas**: suma de balances negativos de cuentas tipo credit
- **Deudas externas**: suma de balances de cuentas tipo debt

Esto reemplaza el desglose actual de 3 items (Disponible, Invertido, Deuda) con uno de 5 que es mas descriptivo y no mezcla tipos de deuda.

### 3. Balance del mes (simplificado a 2 columnas)
Se eliminan los 3 bloques actuales (Ganado, Gastado, Te queda) y se reemplazan por 2:
- **Ingresos**: total de ingresos del mes
- **Gastos**: total de gastos del mes

Se elimina "Te queda" porque era redundante con "Disponible" de arriba. Se agrega una linea debajo con el balance neto (ingresos - gastos) en texto pequeno.

### 4. Presupuesto mensual
Se mantiene igual: barra de progreso con porcentaje y microcopy de semaforo.

### 5. Pagos proximos
Se mantiene igual: lista de suscripciones y pagos de tarjetas en los proximos 14 dias.

### 6. Top 5 categorias
Se mantiene igual: desglose de gastos por categoria con barras de progreso.

### 7. Ultimos movimientos
Se mantiene igual: lista de los 5 movimientos mas recientes del mes con click para editar.

### Que se elimina
- **Botones de acceso rapido** (Registrar, Presupuesto, Balances, Telegram): el usuario menciona que no aportan valor en el home. El boton flotante "+" para registrar ya existe. La navegacion lateral ya cubre Presupuesto y Balances. El link de Telegram se puede acceder desde la sidebar o la pagina de ajustes.

## Cambios tecnicos

### `src/pages/Index.tsx`
- Recalcular `liquidez` como solo cuentas checking + savings
- Agregar `creditoDisponible` = suma de (creditLimit - |balance|) para cuentas credit con creditLimit
- Agregar `deudaTarjetas` = suma de |balance| de cuentas credit
- Agregar `deudasExternas` = suma de |balance| de cuentas debt
- Eliminar bloque de Quick Actions (grid de 4 botones)
- Cambiar grid de 3 columnas (Ganado/Gastado/Te queda) a 2 columnas (Ingresos/Gastos) con linea de balance neto
- Actualizar el bloque de Capital Total con los 5 desgloses
- Mantener todo lo demas igual
