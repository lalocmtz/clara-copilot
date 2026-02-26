

# Sistema de prioridad de saldos y reconciliacion de estados de cuenta

## Estado: ✅ IMPLEMENTADO

### Cambios realizados:

1. **DB**: `balance_updated_at` en accounts, `status` en transactions
2. **AppContext**: `addTransaction` acepta `skipBalanceUpdate`, `updateAccount` registra `balance_updated_at` automáticamente
3. **StatementImporter**: Reconciliación inteligente (duplicados, discrepancias, nuevos), importa sin afectar saldos, nuevos como `pending`
4. **Transactions**: Badge "Pendiente", filtro por status, fondo diferente para pendientes
5. **TransactionEditor**: Botón "Confirmar movimiento" para pendientes
6. **Accounts**: Muestra "Actualizado: hace X" en cada cuenta
7. **mock-data**: Interfaces actualizadas con `status` y `balanceUpdatedAt`
