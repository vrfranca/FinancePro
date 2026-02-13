
import { Category, Account, User } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Administrador', email: 'admin@finance.pro' },
  { id: '2', name: 'Usuário Teste', email: 'teste@finance.pro' }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Aluguel', type: 'EXPENSE', color: '#ef4444' },
  { id: 'c2', name: 'Alimentação', type: 'EXPENSE', color: '#f59e0b' },
  { id: 'c3', name: 'Salário', type: 'INCOME', color: '#10b981' },
  { id: 'c4', name: 'Freela', type: 'INCOME', color: '#3b82f6' },
  { id: 'c5', name: 'Transporte', type: 'EXPENSE', color: '#8b5cf6' },
  { id: 'c6', name: 'Lazer', type: 'EXPENSE', color: '#ec4899' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'Carteira', type: 'CASH', initialBalance: 0 },
  { id: 'a2', name: 'Banco Principal', type: 'BANK', initialBalance: 1500 },
  { id: 'a3', name: 'Cartão de Crédito', type: 'CREDIT', initialBalance: 0 },
];
