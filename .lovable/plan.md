

# Pulir la seccion de Suscripciones y Gastos Fijos

## Cambios en la base de datos

Agregar columnas a la tabla `subscriptions`:
- `billing_day` (integer, nullable) -- dia del mes en que se cobra (1-31), reemplaza la logica de `next_date` como fecha fija
- `sub_type` (text, default 'digital') -- tipo: 'digital' (suscripciones) o 'fixed' (gastos fijos como renta, internet)
- `category` (text, nullable) -- nombre de la categoria vinculada
- `category_icon` (text, default '🔄') -- icono de la categoria

La columna `next_date` se mantiene pero se calculara automaticamente a partir de `billing_day`.

## Cambios en el modelo de datos

### `src/lib/mock-data.ts`
Actualizar la interfaz `Subscription`:
- Agregar `billingDay?: number` (dia del mes)
- Agregar `subType: 'digital' | 'fixed'` (tipo de gasto)
- Agregar `category?: string` y `categoryIcon?: string`

## Cambios en el contexto

### `src/context/AppContext.tsx`
- Mapear las nuevas columnas (`billing_day`, `sub_type`, `category`, `category_icon`) en las funciones de lectura, creacion y actualizacion de suscripciones
- Calcular `nextDate` automaticamente desde `billingDay`: si el dia ya paso este mes, mostrar el proximo mes

## Rediseno de la pagina

### `src/pages/Subscriptions.tsx` (reescribir)

**Encabezado con resumen:**
- Total mensual (suma de las mensuales + anuales/12)
- Total anual (suma de las mensuales*12 + anuales)
- Indicador de cuantas ya se pagaron este mes vs pendientes

**Dos secciones colapsables:**
1. "Suscripciones digitales" -- Netflix, Spotify, Adobe, etc.
2. "Gastos fijos" -- Renta, internet, luz, telefono, etc.

**Cada item muestra:**
- Icono de categoria + nombre
- Monto con indicador "mensual" o "anual"
- Dia de cobro (ej: "Dia 15 de cada mes")
- Estado: pagado (check verde) o pendiente
- Costo equivalente mensual/anual segun corresponda

**Barra de progreso** del mes: cuantas suscripciones ya se pagaron vs cuantas faltan.

## Rediseno del editor

### `src/components/SubscriptionEditor.tsx` (reescribir)

- Cambiar "Proxima fecha de cobro" por un selector numerico de "Dia de cobro" (1-31)
- Agregar selector de tipo: "Suscripcion digital" o "Gasto fijo"
- Agregar selector de categoria (usando las categorias existentes del usuario)
- Mostrar calculo automatico: si es mensual -> cuanto al ano; si es anual -> cuanto al mes
- El campo `nextDate` se calcula automaticamente al guardar

## Flujo del usuario

1. Abre "Suscripciones" y ve arriba el resumen: $X/mes, $X/ano, 3 de 8 pagadas
2. Ve dos secciones colapsables: digitales y gastos fijos
3. Cada item muestra el dia de cobro, monto, categoria y estado
4. Al tocar uno, se abre el editor con dia de cobro (no fecha completa)
5. Al agregar uno nuevo, elige tipo, categoria, monto, dia, y frecuencia
6. El sistema calcula automaticamente la proxima fecha a partir del dia

