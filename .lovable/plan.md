

# Agregar edicion y eliminacion de categorias con presupuesto asignado

## Problema actual
Las categorias que ya tienen un presupuesto asignado (Comida, Transporte, Servicios, etc.) solo se pueden editar desde el modal de "Categorias" (icono de engrane). Pero en la tabla de presupuestos no hay forma de editarlas o eliminarlas directamente, y el usuario necesita poder hacerlo para limpiar las categorias precargadas.

## Solucion
Agregar botones de editar y eliminar directamente en cada fila de la tabla de presupuestos, y tambien asegurar que al eliminar una categoria desde el CategoryManager se elimine su presupuesto asociado.

## Cambios

### `src/pages/Budgets.tsx`
- Agregar un boton de eliminar (icono Trash2) en cada fila de presupuesto existente
- Al presionar eliminar, mostrar confirmacion inline (igual que en CategoryManager)
- Al confirmar, llamar a `deleteBudget(id)` para quitar el presupuesto de esa categoria
- Agregar un boton de editar categoria (icono Pencil) que abre el CategoryManager con esa categoria preseleccionada, o alternativamente, permite renombrar la categoria inline
- Importar iconos adicionales: `Pencil`, `Trash2`

### Comportamiento esperado
- Cada fila de presupuesto tendra: nombre de categoria, monto (ya editable con click), gastado, restante, progreso, y un boton de eliminar presupuesto
- Al eliminar un presupuesto, la categoria vuelve a aparecer en "Categorias sin presupuesto" (si sigue activa)
- El boton de Categorias (engrane) sigue funcionando igual para editar nombre/icono o eliminar categorias completamente

### Detalle tecnico
- En la fila de cada budget, agregar un icono Trash2 al final con confirmacion
- Agregar estado `confirmDeleteBudgetId` para manejar la confirmacion inline
- La funcion `handleDeleteBudget` ya existe, solo falta exponerla en la UI de cada fila

