

# Mejorar la experiencia de vinculacion de Telegram

## Problemas actuales

1. **El "Paso 1: Configurar webhook"** no deberia ser visible para el usuario. Es un detalle tecnico que solo confunde. El webhook se debe configurar automaticamente cuando el usuario genera su codigo.
2. **No se muestra el nombre del bot.** El usuario no sabe a que bot buscar en Telegram. Necesita ver algo como "Busca a @MiBot en Telegram".
3. **La interfaz no es intuitiva.** Falta un flujo visual claro paso a paso con instrucciones amigables.
4. **No hay indicador de estado.** El usuario no sabe si ya esta vinculado o no.
5. **El `config.toml` no tiene las funciones configuradas** con `verify_jwt = false`, lo cual puede causar que Telegram no pueda llamar al webhook.

## Solucion

Redisenar el componente `TelegramLink.tsx` para que sea un flujo guiado, visualmente claro, con estos pasos:

### Paso 1 (automatico, invisible para el usuario)
Al abrir el modal, se configura el webhook silenciosamente en segundo plano. El usuario no ve nada de esto.

### Paso 2 (visible) - Busca tu bot
Mostrar instruccion clara: "Abre Telegram y busca a **@NombreDelBot**" con un boton que abra directamente `https://t.me/NombreDelBot`.

### Paso 3 (visible) - Envia el codigo
Mostrar el comando `/vincular 123456` con boton de copiar y cuenta regresiva de 10 minutos.

### Paso 4 (visible) - Listo
Despues de vincular, mostrar instrucciones de uso con ejemplos.

## Cambios tecnicos

### 1. `src/components/TelegramLink.tsx` (reescribir)

- Eliminar el boton manual de "Configurar webhook" -- hacerlo automaticamente al abrir el modal
- Agregar una constante o campo para el nombre del bot (se puede obtener via la API de Telegram `getMe` en el setup, o pedirle al usuario que lo configure)
- Disenar un flujo visual con pasos numerados estilo stepper
- Agregar un boton "Abrir en Telegram" que lleve a `https://t.me/{bot_username}`
- Verificar si el usuario ya tiene un `telegram_link` activo y mostrar estado "Ya vinculado"
- Agregar opcion de desvincular

### 2. `supabase/functions/telegram-setup/index.ts` (modificar)

- Ademas de configurar el webhook, llamar a `getMe` de la API de Telegram para obtener el username del bot
- Retornar el username en la respuesta para que el frontend lo muestre

### 3. `supabase/config.toml`

Nota: este archivo se gestiona automaticamente, pero las funciones necesitan `verify_jwt = false` para que Telegram pueda enviar webhooks. Si el sistema no lo configura automaticamente, habra que verificar que las funciones sean accesibles sin JWT.

### Flujo del usuario (nuevo)

1. Toca el boton "Telegram" en la pantalla principal
2. Se abre un modal con instrucciones claras y visuales
3. Ve: "Paso 1: Abre tu bot en Telegram" con un boton azul "Abrir @MiBot en Telegram"
4. Ve: "Paso 2: Envia este comando" con `/vincular 482917` y boton de copiar
5. Ve: "Paso 3: Listo! Ya puedes enviar mensajes como: Gaste 200 en uber"
6. Si ya esta vinculado, ve un indicador verde "Telegram vinculado" con opcion de desvincular

### Estructura visual del modal

```text
+------------------------------------------+
|  [Bot icon]  Vincular Telegram           |
|  Registra gastos desde Telegram          |
|                                          |
|  (1) Abre tu bot en Telegram             |
|      [ Abrir @MiBot en Telegram ]        |
|                                          |
|  (2) Envia este comando:                 |
|      /vincular 482917        [Copiar]    |
|      El codigo expira en 10 min          |
|                                          |
|  (3) Listo! Envia mensajes como:         |
|      "Gaste 200 en uber"                 |
|      "Ingreso 5000 nomina"              |
|      "150 comida BBVA"                   |
|      "/resumen" para ver tu mes          |
+------------------------------------------+
```

