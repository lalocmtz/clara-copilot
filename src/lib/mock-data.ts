export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  date: string;
  category: string;
  categoryIcon: string;
  account: string;
  toAccount?: string;
  notes?: string;
  merchant?: string;
  status?: 'confirmed' | 'pending';
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'debt';
  balance: number;
  currency: string;
  creditLimit?: number;
  cutoffDate?: number;
  paymentDate?: number;
  debtTo?: string;
  balanceUpdatedAt?: string;
}

export interface Budget {
  id: string;
  category: string;
  categoryIcon: string;
  budgeted: number;
  spent: number;
  period: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  nextDate: string;
  paid: boolean;
  billingDay?: number;
  subType: 'digital' | 'fixed';
  category?: string;
  categoryIcon?: string;
}

export interface CategorySummary {
  name: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface Investment {
  id: string;
  name: string;
  type: 'crypto' | 'acciones' | 'fondo' | 'negocio';
  current_value: number;
  cost_basis: number;
  last_updated: string;
}

export const accounts: Account[] = [
  { id: '1', name: 'BBVA Débito', type: 'checking', balance: 45200, currency: 'MXN' },
  { id: '2', name: 'Nu Ahorro', type: 'savings', balance: 18500, currency: 'MXN' },
  { id: '3', name: 'AMEX', type: 'credit', balance: -12800, currency: 'MXN', creditLimit: 50000, cutoffDate: 15, paymentDate: 5 },
];

export const categories = [
  { id: '1', name: 'Comida', icon: '🍽', type: 'expense' as const },
  { id: '2', name: 'Transporte', icon: '🚗', type: 'expense' as const },
  { id: '3', name: 'Servicios', icon: '💡', type: 'expense' as const },
  { id: '4', name: 'Ads', icon: '📢', type: 'expense' as const },
  { id: '5', name: 'Suscripciones', icon: '🔄', type: 'expense' as const },
  { id: '6', name: 'Ocio', icon: '🎮', type: 'expense' as const },
  { id: '7', name: 'Salud', icon: '🏥', type: 'expense' as const },
  { id: '8', name: 'Otros', icon: '📦', type: 'expense' as const },
  { id: '9', name: 'Nómina', icon: '💼', type: 'income' as const },
  { id: '10', name: 'Freelance', icon: '💻', type: 'income' as const },
  { id: '11', name: 'Ventas', icon: '💰', type: 'income' as const },
];

export const investments: Investment[] = [
  { id: '1', name: 'Bitcoin', type: 'crypto', current_value: 28500, cost_basis: 22000, last_updated: '2026-02-26' },
  { id: '2', name: 'VOO (S&P 500)', type: 'fondo', current_value: 45000, cost_basis: 40000, last_updated: '2026-02-25' },
  { id: '3', name: 'Proyecto freelance equity', type: 'negocio', current_value: 15000, cost_basis: 10000, last_updated: '2026-02-20' },
];

export const transactions: Transaction[] = [
  { id: '1', type: 'expense', amount: 250, currency: 'MXN', date: '2026-02-26', category: 'Comida', categoryIcon: '🍽', account: 'BBVA Débito', merchant: 'Tacos El Pastor' },
  { id: '2', type: 'income', amount: 12000, currency: 'MXN', date: '2026-02-25', category: 'Ventas', categoryIcon: '💰', account: 'BBVA Débito', notes: 'Proyecto web' },
  { id: '3', type: 'expense', amount: 3500, currency: 'MXN', date: '2026-02-24', category: 'Ads', categoryIcon: '📢', account: 'AMEX', merchant: 'Meta Ads' },
  { id: '4', type: 'expense', amount: 180, currency: 'MXN', date: '2026-02-24', category: 'Transporte', categoryIcon: '🚗', account: 'BBVA Débito', merchant: 'Uber' },
  { id: '5', type: 'expense', amount: 899, currency: 'MXN', date: '2026-02-23', category: 'Suscripciones', categoryIcon: '🔄', account: 'AMEX', merchant: 'Spotify + Adobe' },
  { id: '6', type: 'income', amount: 8500, currency: 'MXN', date: '2026-02-22', category: 'Freelance', categoryIcon: '💻', account: 'Nu Ahorro', notes: 'Consultoría' },
  { id: '7', type: 'expense', amount: 450, currency: 'MXN', date: '2026-02-22', category: 'Ocio', categoryIcon: '🎮', account: 'BBVA Débito', merchant: 'Steam' },
  { id: '8', type: 'expense', amount: 1200, currency: 'MXN', date: '2026-02-21', category: 'Servicios', categoryIcon: '💡', account: 'BBVA Débito', notes: 'CFE + Internet' },
  { id: '9', type: 'expense', amount: 320, currency: 'MXN', date: '2026-02-20', category: 'Comida', categoryIcon: '🍽', account: 'BBVA Débito', merchant: 'Superama' },
  { id: '10', type: 'expense', amount: 2800, currency: 'MXN', date: '2026-02-19', category: 'Ads', categoryIcon: '📢', account: 'AMEX', merchant: 'Google Ads' },
];

export const budgets: Budget[] = [
  { id: '1', category: 'Comida', categoryIcon: '🍽', budgeted: 4000, spent: 2870, period: '2026-02' },
  { id: '2', category: 'Transporte', categoryIcon: '🚗', budgeted: 2000, spent: 1180, period: '2026-02' },
  { id: '3', category: 'Servicios', categoryIcon: '💡', budgeted: 3000, spent: 1200, period: '2026-02' },
  { id: '4', category: 'Ads', categoryIcon: '📢', budgeted: 8000, spent: 6300, period: '2026-02' },
  { id: '5', category: 'Suscripciones', categoryIcon: '🔄', budgeted: 1500, spent: 899, period: '2026-02' },
  { id: '6', category: 'Ocio', categoryIcon: '🎮', budgeted: 2000, spent: 1450, period: '2026-02' },
  { id: '7', category: 'Salud', categoryIcon: '🏥', budgeted: 1500, spent: 0, period: '2026-02' },
];

export const subscriptions: Subscription[] = [
  { id: '1', name: 'Spotify', amount: 199, frequency: 'monthly', nextDate: '2026-03-15', paid: false, billingDay: 15, subType: 'digital', category: 'Suscripciones', categoryIcon: '🔄' },
  { id: '2', name: 'Adobe CC', amount: 700, frequency: 'monthly', nextDate: '2026-03-10', paid: false, billingDay: 10, subType: 'digital', category: 'Suscripciones', categoryIcon: '🔄' },
  { id: '3', name: 'ChatGPT Plus', amount: 449, frequency: 'monthly', nextDate: '2026-03-01', paid: false, billingDay: 1, subType: 'digital', category: 'Suscripciones', categoryIcon: '🔄' },
  { id: '4', name: 'Netflix', amount: 299, frequency: 'monthly', nextDate: '2026-03-08', paid: false, billingDay: 8, subType: 'digital', category: 'Ocio', categoryIcon: '🎮' },
  { id: '5', name: 'iCloud', amount: 49, frequency: 'monthly', nextDate: '2026-03-12', paid: false, billingDay: 12, subType: 'digital', category: 'Suscripciones', categoryIcon: '🔄' },
  { id: '6', name: 'Renta', amount: 8500, frequency: 'monthly', nextDate: '2026-03-01', paid: false, billingDay: 1, subType: 'fixed', category: 'Servicios', categoryIcon: '💡' },
  { id: '7', name: 'Internet', amount: 699, frequency: 'monthly', nextDate: '2026-03-05', paid: false, billingDay: 5, subType: 'fixed', category: 'Servicios', categoryIcon: '💡' },
  { id: '8', name: 'Celular', amount: 399, frequency: 'monthly', nextDate: '2026-03-18', paid: false, billingDay: 18, subType: 'fixed', category: 'Servicios', categoryIcon: '💡' },
];

export const topCategories: CategorySummary[] = [
  { name: 'Ads', icon: '📢', amount: 6300, percentage: 42 },
  { name: 'Comida', icon: '🍽', amount: 2870, percentage: 19 },
  { name: 'Ocio', icon: '🎮', amount: 1450, percentage: 10 },
  { name: 'Servicios', icon: '💡', amount: 1200, percentage: 8 },
  { name: 'Suscripciones', icon: '🔄', amount: 899, percentage: 6 },
];

export const monthlyTotals = {
  income: 20500,
  expenses: 14899,
  available: 50900,
  creditDebt: 12800,
  invested: 88500,
};
