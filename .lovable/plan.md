

# Correccion: Presupuestos con gastos fantasma

## El problema

Los presupuestos tienen un campo `spent` (gastado) guardado directamente en la base de datos como un numero estatico. Cuando se sembraron los datos demo, se insertaron valores como `spent: 2870` para Comida, `spent: 1180` para Transporte, etc. Esos numeros no se recalculan nunca a partir de las transacciones reales. Por eso, aunque borres todas las transacciones, los presupuestos siguen mostrando gastos.

## La solucion

Calcular el campo `spent` dinamicamente a partir de las transacciones reales del mes correspondiente, en lugar de confiar en el valor estatico de la base de datos. Asi, si no hay transacciones, los gastos aparecen en $0.

## Cambios tecnicos

### 1. `src/context/AppContext.tsx`

Despues de cargar budgets y transacciones, recalcular el `spent` de cada presupuesto sumando las transacciones de tipo `expense` que coincidan en categoria y periodo (mes). Esto reemplaza el valor estatico del campo `spent` en la base de datos con un valor computado.

```text
Para cada budget:
  1. Extraer el periodo (ej: "2026-02")
  2. Filtrar transacciones tipo "expense" cuya fecha inicie con ese periodo
  3. Filtrar por categoria que coincida con la del budget
  4. Sumar los montos = spent real
```

### 2. `src/pages/Budgets.tsx`

No se necesitan cambios en la UI. Una vez que el contexto entregue los valores correctos de `spent`, la pagina de presupuestos mostrara automaticamente:
- Presupuesto mensual total correcto
- Gastado: $0 (cuando no hay transacciones)
- Te queda: el monto completo del presupuesto
- Grafica de pastel vacia (sin datos de gasto)
- Barras de progreso en 0%

### 3. Seed data (`seedDemoData`)

Cambiar los inserts de budgets demo para que `spent` se inserte como 0, ya que el valor real se calculara de las transacciones. Esto evita inconsistencias futuras.

### Flujo resultante

1. Usuario sin transacciones: todos los presupuestos muestran $0 gastado
2. Usuario agrega transaccion de gasto en categoria "Comida": el presupuesto de Comida se actualiza automaticamente
3. Usuario borra transaccion: el gasto baja correspondientemente
4. No se necesita editar manualmente el campo "gastado" -- se calcula solo

