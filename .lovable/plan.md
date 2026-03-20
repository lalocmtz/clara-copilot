

# Fix: Budget spent tracking + month navigation

## Problem

1. **Category mismatch**: Budget categories store plain names (`Transporte`), but transaction categories are inconsistent — some have emoji prefix (`🚗 Transporte`), some don't (`Transporte`). The spent calculation in AppContext does `t.category === b.category` which fails for emoji-prefixed transactions.

2. **No month navigation**: Budgets page only shows the current month. User can't review past months.

## Solution

### 1. Fix spent calculation (AppContext.tsx)

Update the dynamic spent calculation to match transactions by stripping emoji prefixes, or by matching both the budget category name and `icon + name` pattern:

```typescript
const budDataWithSpent = budData.map(b => {
  const matchingCat = catData.find(c => c.name === b.category);
  const iconPrefix = matchingCat ? matchingCat.icon + ' ' : '';
  const realSpent = txData
    .filter(t => t.type === 'expense' && t.date.startsWith(b.period) && 
      (t.category === b.category || t.category === iconPrefix + b.category))
    .reduce((sum, t) => sum + t.amount, 0);
  return { ...b, spent: realSpent };
});
```

This handles both formats without requiring a data migration.

### 2. Add month navigation to Budgets page (Budgets.tsx)

Add left/right arrows to navigate between months (like the dashboard already has). Show budgets and their dynamically calculated spent for any selected month, not just the current one.

- Add `selectedMonth` state defaulting to current month
- Navigation arrows with month/year label
- Filter budgets by `selectedMonth` instead of hardcoded `currentPeriod`
- Show historical months' budget performance

### 3. Normalize future transaction categories

In QuickAddTransaction, StatementImporter, and TransactionEditor — ensure transactions always save category as the plain name (without emoji). The icon is already stored separately in `categoryIcon`. This prevents future mismatches.

For existing data, the fuzzy matching in step 1 covers both old and new formats.

## Files changed

- **`src/context/AppContext.tsx`** — Fix category matching logic in spent calculation
- **`src/pages/Budgets.tsx`** — Add month selector with navigation arrows
- **`src/components/StatementImporter.tsx`** — Ensure category saves as plain name (if currently saving with emoji)

