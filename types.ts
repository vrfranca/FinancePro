
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Account {
  id: string;
  userId: string; // owner of this account (each user has their own set)
  name: string;

  // CASH and BANK behave as normal accounts. CREDIT is treated as a
  // "limite disponível"; its `initialBalance` field represents the
  // credit limit and is counted as part of total income/balance.
  type: 'CASH' | 'BANK' | 'CREDIT';

  initialBalance: number;

  // NEW: date when the account starts to be considered in balance/history
  // stored as ISO string (yyyy-mm-dd)
  startDate: string;

  // only relevant for CREDIT accounts; day of month when the card bill is due
  dueDay?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  type: TransactionType;
  isRecurring: boolean;
  notes?: string; // adiciona como opcional
}

export interface RecurringItem {
  id: string;
  userId: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  categoryId: string;
  accountId: string;
  type: TransactionType;
  // optional metadata to support a fixed number of occurrences (installments)
  occurrences?: number;
  // date when the recurrence was created, used to calculate how many
  // months have already passed relative to `occurrences`
  startDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  active?: boolean;
  username?: string;
  isAdmin?: boolean;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  recurringItems: RecurringItem[];
}
