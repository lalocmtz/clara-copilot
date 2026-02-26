
# Conectar Telegram Bot para registrar gastos

## Como funciona

Envias un mensaje a tu bot de Telegram como:
- "Gaste 200 en uber"
- "Ingreso 5000 nomina"
- "150 comida BBVA"

El bot usa IA (Gemini Flash, sin costo extra) para interpretar el mensaje, extraer monto, categoria, cuenta y tipo, y lo registra automaticamente en tu base de datos.

## Que se necesita

1. **Tu token de BotFather** -- te lo pedire como secreto seguro (nunca queda en el codigo)
2. **Una funcion backend** que recibe los mensajes de Telegram y los procesa
3. **Registrar el webhook** de Telegram para que apunte a tu funcion

## Arquitectura

```text
Usuario (Telegram)
    |
    v
Telegram API --> Webhook --> Edge Function (telegram-bot)
                                |
                                v
                          Gemini Flash (parsea mensaje)
                                |
                                v
                          Base de datos (transactions)
                                |
                                v
                          Respuesta al usuario en Telegram
```

## Cambios tecnicos

### 1. Secreto: TELEGRAM_BOT_TOKEN
Te pedire que ingreses tu token de BotFather como secreto seguro.

### 2. Nueva funcion backend: `supabase/functions/telegram-bot/index.ts`

Recibe el webhook de Telegram y:

1. Extrae el mensaje de texto y el chat_id
2. Busca al usuario vinculado a ese chat_id en la tabla `telegram_links`
3. Envia el mensaje a Gemini Flash con un prompt que le pide extraer:
   - tipo (gasto o ingreso)
   - monto
   - categoria (de las categorias del usuario)
   - cuenta (de las cuentas del usuario)
   - notas/merchant
4. Inserta la transaccion en la base de datos
5. Responde al usuario en Telegram con confirmacion: "Registrado: Gasto $200 en Transporte (Uber) - BBVA Debito"

Comandos especiales:
- `/vincular [codigo]` -- vincula tu cuenta de Telegram con tu usuario de la app
- `/resumen` -- resumen rapido de gastos del mes
- `/ayuda` -- lista de comandos

### 3. Nueva tabla: `telegram_links`
Vincula un chat_id de Telegram con un user_id de la app.

Columnas:
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- telegram_chat_id (bigint, UNIQUE, NOT NULL)
- created_at (timestamp)

RLS: los usuarios solo ven/crean sus propios vinculos.

### 4. Funcion para generar codigo de vinculacion

Para vincular tu Telegram con tu cuenta, la app web genera un codigo temporal de 6 digitos. Luego envias `/vincular 123456` en Telegram y queda asociado.

Nueva tabla `telegram_link_codes`:
- id (uuid)
- user_id (uuid)
- code (text, 6 digitos)
- expires_at (timestamp, +10 min)
- used (boolean)

### 5. UI en la app web: boton "Vincular Telegram"

En la pagina principal o en un menu de configuracion, un boton que:
1. Genera un codigo de vinculacion
2. Muestra: "Abre tu bot @TuBot en Telegram y envia: /vincular 123456"
3. El codigo expira en 10 minutos

### 6. Configurar webhook

Crear una funcion auxiliar `supabase/functions/telegram-setup/index.ts` que registra el webhook de Telegram apuntando a la funcion `telegram-bot`. Se ejecuta una vez manualmente.

### 7. Config: `supabase/config.toml`

Agregar ambas funciones con `verify_jwt = false` (Telegram no envia JWT, la autenticacion es por chat_id vinculado).

## Flujo completo

1. Abres la app web, haces click en "Vincular Telegram"
2. Te muestra un codigo: `482917`
3. Abres Telegram, buscas tu bot, envias: `/vincular 482917`
4. El bot responde: "Cuenta vinculada exitosamente"
5. Ahora envias: "Gaste 200 en uber"
6. El bot responde: "Registrado: Gasto $200.00 en Transporte (Uber) - BBVA Debito"
7. Abres la app web y ves la transaccion reflejada

## Resumen de archivos

- **Nuevo**: `supabase/functions/telegram-bot/index.ts` (logica principal)
- **Nuevo**: `supabase/functions/telegram-setup/index.ts` (registro de webhook)
- **Modificar**: `supabase/config.toml` (agregar funciones)
- **Migracion SQL**: crear tablas `telegram_links` y `telegram_link_codes`
- **Nuevo/Modificar**: componente UI para vincular Telegram (boton + modal con codigo)
