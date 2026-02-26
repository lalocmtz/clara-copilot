
# Importar estados de cuenta con IA

## Resumen
Crear una funcionalidad donde puedas subir archivos (PDF, imágenes, capturas de pantalla) de estados de cuenta bancarios, y el sistema use IA para extraer automáticamente todos los movimientos, categorizarlos, y registrarlos como transacciones vinculadas a una cuenta.

## Flujo del usuario
1. En la página de Transacciones, aparece un botón "Importar estado de cuenta"
2. Se abre un diálogo donde seleccionas la cuenta destino y subes el archivo (PDF o imagen)
3. El sistema envía el archivo a una función backend que usa IA con visión para leer el documento
4. La IA extrae cada movimiento: fecha, monto, tipo (gasto/ingreso), descripción, y sugiere una categoría
5. Se muestra una vista previa con todos los movimientos detectados para que puedas revisar, editar o descartar antes de confirmar
6. Al confirmar, todos los movimientos se registran como transacciones y los saldos de la cuenta se actualizan

## Cambios técnicos

### 1. Storage bucket para archivos
Crear un bucket `statements` en Lovable Cloud para almacenar temporalmente los archivos subidos (PDFs e imágenes).

### 2. Edge function `parse-statement`
Nueva función backend que:
- Recibe el archivo (ruta en storage) y el nombre de la cuenta
- Obtiene las categorías existentes del usuario para que la IA las use
- Convierte el archivo a base64 y lo envía a Lovable AI (google/gemini-2.5-flash con capacidad de visión) 
- Le pide a la IA que extraiga todos los movimientos en formato JSON estructurado (usando tool calling):
  - fecha, monto, tipo (gasto/ingreso), descripción/comercio, categoría sugerida, icono de categoría
- Si la IA identifica categorías que no existen, las sugiere como nuevas
- Devuelve el arreglo de movimientos parseados

### 3. Componente `StatementImporter.tsx`
Nuevo componente con:
- Selector de cuenta destino (dropdown con las cuentas del usuario)
- Zona de arrastre/carga de archivos (acepta PDF, PNG, JPG, JPEG, WEBP)
- Indicador de progreso mientras la IA procesa
- Tabla de vista previa con los movimientos detectados:
  - Checkbox para incluir/excluir cada movimiento
  - Campos editables: categoría, tipo, monto
  - Resumen: total de ingresos y gastos detectados
- Botón "Confirmar importación" que llama a `addTransaction` por cada movimiento seleccionado

### 4. Integración en la página de Transacciones
- Agregar botón "Importar estado de cuenta" junto al formulario de agregar transacción
- El botón abre un Dialog con el componente `StatementImporter`

### 5. Actualización del contexto (`AppContext.tsx`)
- Agregar función `addTransactions` (plural) para insertar múltiples transacciones en batch y actualizar saldos de cuenta de forma eficiente (una sola actualización de saldo por el total neto, en lugar de una por cada transacción)

### 6. Categorías nuevas
- Si la IA sugiere categorías que no existen en el sistema del usuario, se crean automáticamente al confirmar la importación

## Formatos soportados
- **PDF**: Estados de cuenta bancarios en formato digital
- **Imágenes (PNG, JPG, WEBP)**: Capturas de pantalla de apps bancarias o fotos de estados de cuenta impresos

## Archivos a crear/modificar
- `supabase/functions/parse-statement/index.ts` (nuevo) -- edge function con IA
- `src/components/StatementImporter.tsx` (nuevo) -- UI de importación
- `src/pages/Transactions.tsx` (modificar) -- agregar botón de importar
- `src/context/AppContext.tsx` (modificar) -- agregar `addTransactions` batch
- Migración SQL para crear el bucket de storage
