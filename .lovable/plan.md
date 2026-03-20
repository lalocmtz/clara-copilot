

# Plan: Desglose de liquidez real en el dashboard

## Qué se hará

En la tarjeta de "Liquidez real" del dashboard (`Index.tsx`), agregar un mini-desglose debajo del monto total que liste cada cuenta líquida (checking/savings) con su nombre, tipo y saldo individual. Así el usuario ve de dónde viene su liquidez.

## Cambios

### `src/pages/Index.tsx`

1. Importar `accounts` desde `useAppData()` (ya se usa en el componente).
2. Filtrar cuentas líquidas: `accounts.filter(a => a.type === 'checking' || a.type === 'savings')`.
3. Dentro de la tarjeta de "Liquidez real" (líneas ~152-166), después del monto grande y antes de la grid de métricas, insertar una lista compacta:
   - Por cada cuenta: nombre, tipo (Débito/Ahorro), y saldo formateado.
   - Estilo sutil con `text-sm`, separador `border-b`, iconos de `Landmark`/`PiggyBank`.
4. Solo se muestra si hay más de una cuenta (si hay una sola, el total ya es suficiente).

No se requieren cambios en backend ni en otros archivos.

