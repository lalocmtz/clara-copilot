

# Fix: Transactions not updating account/card balances

## Root cause

There are two bugs working together:

1. **Stale closure in `updateAccountBalance`**: The function reads `accounts` from its `useCallback` closure. When called, it may reference an outdated balance, computing `oldBalance + delta` from stale data. If the account isn't found in the stale array, it silently returns without updating anything.

2. **Credit card transactions go to the wrong table**: QuickAddTransaction shows all accounts (including credit-type entries). When expenses hit a credit card account name, `updateAccountBalance` updates the `accounts` table balance — but the financial position system reads from `credit_cards`. The credit card balances never actually change.

## Plan

### 1. Fix `updateAccountBalance` to be atomic (AppContext.tsx)

Replace the current read-from-closure approach with a Supabase RPC that atomically increments the balance:

```sql
-- New migration: create increment_account_balance function
CREATE OR REPLACE FUNCTION increment_account_balance(account_id uuid, delta numeric)
RETURNS void AS $$
  UPDATE accounts SET balance = balance + delta, balance_updated_at = now()
  WHERE id = account_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

Then `updateAccountBalance` becomes:
- Call the RPC with the account ID and delta
- Use `setAccounts(prev => ...)` to apply the same delta locally
- No more reading stale balance from closure

### 2. Route credit card transactions to `credit_cards` table (AppContext.tsx)

In `addTransaction`, after inserting the transaction:
- Check if the account name matches a credit card (via a lookup or by accepting a `credit_card_id` parameter)
- If it's a credit card: call a new `updateCreditCardBalance` function that atomically updates `credit_cards.current_balance`
- If it's a regular account: call `updateAccountBalance` as before

Add a second RPC for credit cards:
```sql
CREATE OR REPLACE FUNCTION increment_credit_card_balance(card_id uuid, delta numeric)
RETURNS void AS $$
  UPDATE credit_cards SET current_balance = current_balance + delta, updated_at = now()
  WHERE id = card_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### 3. Update QuickAddTransaction to pass `credit_card_id`

When user selects an account that is type `credit`, also pass the corresponding `credit_card_id` so the balance update goes to the right table. This requires matching account names to credit cards or showing credit cards separately in the selector.

### 4. Fix existing data for Mar 6-7 transactions

Using the insert tool (data operations):
- **Hey Banco débito**: Add +18,000 (10,000 nomina + 8,000 servicio de agencia) → balance becomes 25,675
- **Credit cards**: The credit card balances in `credit_cards` table were likely set manually and are already correct, so we only need to fix the checking account

Transactions from Mar 5 and earlier are excluded per user request.

### 5. Sync `accounts` credit entries with `credit_cards` (cleanup)

The old credit-type accounts in the `accounts` table are now redundant. We won't delete them to preserve history, but `updateAccountBalance` should skip them and route to `credit_cards` instead.

---

## Files changed

- **New migration**: `increment_account_balance` and `increment_credit_card_balance` RPCs
- **`src/context/AppContext.tsx`**: Rewrite `updateAccountBalance` to use RPC; add `updateCreditCardBalance`; update `addTransaction` to route credit card updates properly
- **`src/components/QuickAddTransaction.tsx`**: Pass `credit_card_id` when applicable
- **Data fix**: Update Hey Banco débito balance via insert tool

