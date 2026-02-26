
# Quitar botón de reinicio y agregar botón de sincronización

## Problema
El botón de "Restablecer datos demo" (icono de RefreshCw) al lado de "Cerrar sesión" borra todos los datos del usuario y los reemplaza con datos demo. El usuario lo presionó accidentalmente y perdió toda su información real.

## Cambios

### `src/components/Layout.tsx`
- **Eliminar** el botón de reset y la función `handleReset`
- **Eliminar** la importación de `resetAll` del contexto y `RefreshCw` de lucide
- El botón de "Cerrar sesión" se queda como único botón en el footer del sidebar

### `src/context/AppContext.tsx`
- La función `resetAll` se mantiene en el contexto por si se necesita en el futuro (no rompe nada dejarla), pero ya no será accesible desde la interfaz

## Resultado
- No hay forma de que el usuario borre accidentalmente todos sus datos desde la interfaz
- El sidebar queda más limpio con solo el botón de cerrar sesión
- La función `refetchData` ya existe en el contexto para sincronizar datos (por ejemplo después de enviar algo por Telegram), y puede exponerse si se necesita en el futuro
