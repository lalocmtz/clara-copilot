import { useMemo } from "react";
import { useAppData } from "@/context/AppContext";
import { useCreditCards } from "@/services/credit-cards";
import { useDebts } from "@/services/debts";

export interface FinancialPosition {
  realLiquidity: number;
  savingsTotal: number;
  investmentTotal: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  totalCreditAvailable: number;
  totalCardDebt: number;
  totalNonCardDebt: number;
  totalDebt: number;
  immediateCapacity: number;
  netWorth: number;
}

export function useFinancialPosition(): FinancialPosition {
  const { accounts, investments } = useAppData();
  const { data: creditCards = [] } = useCreditCards();
  const { data: debts = [] } = useDebts();

  return useMemo(() => {
    // Only real money accounts (exclude credit type from accounts)
    const liquidAccounts = accounts.filter(
      a => a.type === 'checking' || a.type === 'savings' || a.type === 'cash' || a.type === 'debit' || a.type === 'wallet'
    );
    const realLiquidity = liquidAccounts.reduce((s, a) => s + a.balance, 0);
    const savingsTotal = accounts.filter(a => a.type === 'savings').reduce((s, a) => s + a.balance, 0);
    const investmentTotal = investments.reduce((s, i) => s + i.current_value, 0);

    // Credit cards as single source of truth
    const activeCards = creditCards.filter(c => c.active);
    const totalCreditLimit = activeCards.reduce((s, c) => s + c.creditLimit, 0);
    const totalCreditUsed = activeCards.reduce((s, c) => s + Math.abs(c.currentBalance), 0);
    const totalCreditAvailable = totalCreditLimit - totalCreditUsed;
    const totalCardDebt = totalCreditUsed;

    // Non-card debts only from debts table
    const activeDebts = debts.filter(d => d.active);
    const totalNonCardDebt = activeDebts.reduce((s, d) => s + d.currentBalance, 0);

    const totalDebt = totalCardDebt + totalNonCardDebt;
    const immediateCapacity = realLiquidity + totalCreditAvailable;
    const netWorth = realLiquidity + investmentTotal - totalDebt;

    return {
      realLiquidity,
      savingsTotal,
      investmentTotal,
      totalCreditLimit,
      totalCreditUsed,
      totalCreditAvailable,
      totalCardDebt,
      totalNonCardDebt,
      totalDebt,
      immediateCapacity,
      netWorth,
    };
  }, [accounts, investments, creditCards, debts]);
}
