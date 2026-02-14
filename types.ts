
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT';
  initialBalance: number;
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
