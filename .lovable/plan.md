

# Fix: Tarjetas de crédito — edición, crédito disponible negativo, y filtro de movimientos

## 3 problemas a resolver

### 1. Crédito disponible incorrecto cuando la tarjeta está sobregirada
En `getCardRiskMetrics` (credit-cards.ts línea 169): `availableCredit: card.creditLimit - Math.abs(card.currentBalance)` produce valores negativos cuando el saldo supera el límite (ej: límite 8,600 - deuda 11,668 = -3,068). Pero en la UI se muestra con `formatMoney(Math.abs(n))` que siempre muestra positivo sin signo negativo.

**Fix**: En `Cards.tsx`, mostrar el signo negativo cuando `availableCredit < 0` (ej: "-$3,068"). También ajustar el resumen global de "Crédito disponible" para permitir valores negativos.

### 2. Nombre de tarjeta no editable
El `CardEditor` ya tiene campo de nombre editable — el título del sheet dice "Estado actual de la tarjeta" pero todos los campos incluyendo banco y nombre son editables. Sin embargo, para hacerlo más claro, cambiar el título a "Editar tarjeta" cuando no es nueva.

### 3. "Ver movimientos" lleva a todos los movimientos
Actualmente `navigate('/transactions')` sin filtro. La página de Transactions ya filtra por `accountFilter` (nombre de cuenta).

**Fix**: Navegar con query param `?account=NombreTarjeta` y en `Transactions.tsx` leer el query param para pre-seleccionar el filtro de cuenta.

## Archivos a modificar

- **`src/pages/Cards.tsx`**: Mostrar signo negativo en disponible; cambiar título del editor; pasar query param en "Ver movimientos"
- **`src/pages/Transactions.tsx`**: Leer `?account=` del URL para inicializar `accountFilter`
- **`src/services/credit-cards.ts`**: Sin cambios (el cálculo ya devuelve negativo correctamente)

