

# Separar categorias por tipo (Gasto / Ingreso) y mejorar deteccion de transferencias

## Resumen
Actualmente todas las categorias estan en un solo grupo. El usuario necesita que al registrar un **gasto** solo aparezcan categorias de gasto, y al registrar un **ingreso** aparezcan categorias de ingreso (Nomina, Freelance, TikTok Shop, etc.). Tambien necesita que al importar estados de cuenta, el sistema detecte automaticamente transferencias entre cuentas propias.

## Cambios

### 1. Base de datos: agregar campo `type` a la tabla `categories`
- Agregar columna `type` (text, NOT NULL, default `'expense'`) a la tabla `categories`
- Valores posibles: `'expense'` o `'income'`
- Migrar las categorias existentes: "Ventas" y "Freelance" se actualizan a `type = 'income'`, el resto queda como `'expense'`

### 2. Datos demo: agregar categorias de ingreso por defecto
- En `src/lib/mock-data.ts`, agregar un campo `type` a las categorias demo
- Nuevas categorias de ingreso por defecto: Nomina, Freelance, Ventas (ya existen pero se marcan como ingreso)
- Las categorias de gasto se mantienen: Comida, Transporte, Servicios, Ads, Suscripciones, Ocio, Salud

### 3. Contexto y tipos (`AppContext.tsx` y `mock-data.ts`)
- Agregar `type: 'expense' | 'income'` a la interfaz `Category`
- Actualizar los mappers (`mapCat`) para incluir el campo `type`
- Actualizar `addCategory` para aceptar `type`
- Actualizar `seedDemoData` para incluir el `type` en las categorias demo

### 4. Registro rapido (`QuickAddTransaction.tsx`)
- Cuando el tipo es `'expense'`, filtrar y mostrar solo categorias con `type === 'expense'`
- Cuando el tipo es `'income'`, filtrar y mostrar solo categorias con `type === 'income'`
- Cuando es `'transfer'`, no mostrar categorias (ya funciona asi)

### 5. Editor de transacciones (`TransactionEditor.tsx`)
- Mismo filtro: mostrar categorias segun el tipo de transaccion seleccionado
- Cuando el usuario cambia el tipo, resetear la categoria seleccionada

### 6. Gestor de categorias (`CategoryManager.tsx`)
- Agregar tabs o secciones para "Categorias de Gasto" y "Categorias de Ingreso"
- Al crear una nueva categoria, permitir elegir si es de gasto o ingreso
- Mantener la edicion y eliminacion igual

### 7. Deteccion inteligente de transferencias al importar (`parse-statement/index.ts`)
- Pasar los nombres de las cuentas del usuario al prompt de la IA
- Mejorar el prompt para que, si detecta un movimiento que menciona el nombre de otra cuenta del usuario (ej: "SPEI a Hey Banco", "Pago de Mercado Pago"), lo clasifique automaticamente como `transfer`
- Ejemplo: si el usuario tiene cuentas "Mercado Pago" y "Hey Banco", y en el estado de cuenta de Mercado Pago aparece "TRANSFERENCIA A HEY BANCO $5,000", la IA lo marca como transfer

### 8. Importador (`StatementImporter.tsx`)
- Pasar los nombres de cuentas al edge function para contexto
- Sin cambios visuales en el importador

## Flujo esperado
1. Usuario abre "Registrar" y selecciona "Gasto" -> ve solo categorias de gasto (Comida, Transporte, etc.)
2. Cambia a "Ingreso" -> ve categorias de ingreso (Nomina, Freelance, Ventas, etc.)
3. En el gestor de categorias, puede crear nuevas categorias de ingreso (TikTok Shop, Dinero extra, etc.)
4. Al importar un estado de cuenta, la IA usa los nombres de las cuentas del usuario para detectar transferencias automaticamente

