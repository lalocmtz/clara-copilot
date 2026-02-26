

# Correcciones y Mejoras para Clara

## Problema 1: Los datos se re-siembran al borrar todo

Actualmente, si borras todas tus transacciones, cuentas y categorias, el sistema detecta que no hay datos y vuelve a cargar los datos demo automaticamente. Esto hace que parezca que "no se borra nada".

**Solucion:** Agregar una bandera `demo_seeded` en la tabla `profiles` para rastrear si el usuario ya fue inicializado. Solo se siembra una vez (primer login). Borrar datos despues no re-siembra.

---

## Problema 2: No se pueden editar inversiones

No existe un componente `InvestmentEditor`. Solo existe `updateInvestment` en el contexto, pero sin UI.

**Solucion:** Crear `src/components/InvestmentEditor.tsx` — un modal similar a `AccountEditor` con:
- Nombre de la inversion
- Tipo (crypto, acciones, fondo, negocio)
- Valor actual
- Costo base (lo que invertiste)
- Fecha de la inversion
- Botones de guardar y eliminar

Agregar `addInvestment` y `deleteInvestment` al AppContext.

Modificar `src/pages/Accounts.tsx` para que al hacer click en una inversion se abra el editor, y agregar un boton "Agregar inversion".

---

## Problema 3: Grafica de pastel en Presupuestos

Reemplazar la tabla de presupuestos con una grafica de pastel (pie chart) que muestre el desglose de gastos por categoria.

**Solucion:** Usar `recharts` (ya instalado) para crear un PieChart en `src/pages/Budgets.tsx`. La grafica mostrara las categorias con sus porcentajes de gasto. Se mantiene la tabla debajo para edicion de montos.

---

## Cambios Tecnicos

### Migracion de base de datos
- Agregar columna `demo_seeded` (boolean, default false) a la tabla `profiles`

### `src/context/AppContext.tsx`
- Cambiar logica de seeding: consultar `profiles.demo_seeded` antes de sembrar datos demo
- Despues de sembrar, marcar `demo_seeded = true`
- Agregar funciones `addInvestment` y `deleteInvestment`
- Actualizar `updateInvestment` para soportar `last_updated`

### Nuevo: `src/components/InvestmentEditor.tsx`
- Modal con campos: nombre, tipo, valor actual, costo base, fecha
- Boton eliminar con confirmacion
- Mismo patron visual que AccountEditor

### `src/pages/Accounts.tsx`
- Importar InvestmentEditor
- Hacer inversiones clickeables para editar
- Agregar boton "Agregar" en seccion inversiones

### `src/pages/Budgets.tsx`
- Agregar PieChart de recharts con desglose de gastos por categoria
- Mantener tabla de presupuestos debajo para edicion inline
- Colores coordinados por categoria

### `src/lib/mock-data.ts`
- Actualizar interfaz Investment para que sea consistente

