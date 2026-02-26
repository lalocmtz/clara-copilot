

# Arreglar la seccion de Presupuestos y Categorias

## Problemas identificados

1. **El presupuesto total no se guarda**: Al editar el total, solo cambia una variable local (`tempTotal`) pero nunca se distribuye ni se guarda. El boton "Listo" no hace nada util.

2. **Las categorias no se borran realmente**: El boton de basura solo hace `toggleCategory` (activa/desactiva), pero visualmente parece que las borra. Las categorias "borradas" siguen ahi, solo se ponen semitransparentes.

3. **El selector de emojis esta limitado**: Solo muestra 9 de los 18 emojis disponibles (`emojiOptions.slice(0, 9)`). Ademas, no se puede poner cualquier emoji -- solo los predefinidos.

4. **Los presupuestos no estan sincronizados con las categorias**: Si agregas una categoria nueva, no aparece automaticamente en presupuestos. Y si desactivas una categoria, su presupuesto sigue visible.

5. **No hay forma de agregar presupuestos desde la pagina de presupuestos**: Solo se muestran los que ya existen.

## Solucion propuesta

### 1. Redisenar la pagina de Presupuestos (`src/pages/Budgets.tsx`)

**Presupuesto total:**
- El presupuesto total se calcula como la suma de los presupuestos individuales (no se edita directamente)
- Eliminar el boton de editar el total -- el total es resultado de los individuales

**Tabla de categorias:**
- Cada categoria activa tiene una fila con su presupuesto editable
- Al editar un monto y guardarlo, se actualiza en la base de datos y la UI se refresca
- Agregar boton "Nueva categoria con presupuesto" que permite agregar presupuesto a categorias que aun no tienen
- Las categorias sin presupuesto aparecen como opcion para agregar

### 2. Sincronizar presupuestos con categorias

- Al cargar la pagina, cruzar categorias activas con presupuestos existentes
- Mostrar categorias activas sin presupuesto como "sin asignar" con opcion de agregar monto
- Al desactivar una categoria, ofrecer opcion de eliminar su presupuesto

### 3. Arreglar CategoryManager (`src/components/CategoryManager.tsx`)

**Borrar categorias:**
- Cambiar el boton de basura para que realmente elimine la categoria (con confirmacion)
- Agregar una funcion `deleteCategory` al contexto que haga `DELETE` en la base de datos
- Si la categoria tiene transacciones o presupuestos asociados, mostrar advertencia

**Selector de emojis:**
- Mostrar TODOS los emojis disponibles (los 18), no solo 9
- Agregar un campo de texto donde el usuario pueda pegar cualquier emoji que quiera
- Organizar los emojis en una cuadricula mas amplia

### 4. Actualizar AppContext (`src/context/AppContext.tsx`)

- Agregar funcion `deleteCategory(id)` que elimine de la base de datos y del estado
- Modificar `updateBudget` para que refetch los datos despues de guardar (evitar datos stale)
- Asegurar que al agregar/eliminar categorias se actualicen los presupuestos correspondientes

## Cambios por archivo

### `src/context/AppContext.tsx`
- Agregar `deleteCategory(id: string)` al contexto y a la interfaz
- Refetch despues de mutaciones en presupuestos para evitar montos que no se actualizan
- Exponer `loadAllData` o un `refetch` para forzar recarga cuando sea necesario

### `src/components/CategoryManager.tsx`
- Reemplazar `toggleCategory` por `deleteCategory` con dialogo de confirmacion
- Mostrar todos los 18+ emojis en la cuadricula (quitar el `.slice(0, 9)`)
- Agregar campo de texto para emoji personalizado (el usuario pega el que quiera)
- Mejor layout: cuadricula de emojis mas grande y campo de texto debajo

### `src/pages/Budgets.tsx`
- Eliminar la edicion del "presupuesto total" (se calcula automaticamente)
- El total ahora es solo la suma de los individuales, no editable
- Agregar boton para asignar presupuesto a categorias que aun no tienen uno
- Despues de editar un presupuesto individual, refrescar los datos desde la base de datos
- Agregar slider visual o input mas amigable para asignar montos
- Mostrar categorias sin presupuesto al final con opcion de "Asignar presupuesto"

### Flujo de usuario mejorado

1. Abres Presupuestos y ves todas tus categorias activas con su monto asignado
2. Tocas el monto de cualquier categoria para editarlo -- se guarda al confirmar
3. El total se recalcula automaticamente
4. Si tienes categorias sin presupuesto, aparecen al final con boton "Asignar"
5. Desde "Categorias" puedes agregar nuevas (con cualquier emoji) o eliminar existentes
6. Al eliminar una categoria con presupuesto, se elimina tambien el presupuesto

