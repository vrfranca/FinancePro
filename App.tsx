import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Repeat,
  Settings,
  PieChart,
  User as UserIcon,
  Wallet,
  Menu,
  ChevronDown
} from 'lucide-react';
import { AppState, Transaction, RecurringItem, Category, Account, User } from './types';
import { INITIAL_USERS, INITIAL_CATEGORIES, INITIAL_ACCOUNTS } from './constants';

// Views
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import RecurringView from './components/RecurringView';
import SettingsView from './components/SettingsView';
import ReportsView from './components/ReportsView';
import Login from './components/Login';

const App: React.FC = () => {
  // Load state with migration for isAdmin
  const [state, setState] = useState<AppState>(() => {
    const savedRaw = localStorage.getItem('finance_pro_state');
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw) as AppState;
        // ensure isAdmin flag exists and migrate admin email to match constants
        const adminEmail = INITIAL_USERS.find(x => x.id === '1')?.email ?? 'vrfranca@live.cm';
        const migratedUsers = (parsed.users || []).map(u => ({ ...u, isAdmin: (u as any).isAdmin ?? (u.id === '1'), email: u.id === '1' ? adminEmail : u.email }));
        const migratedCurrent = parsed.currentUser ? { ...parsed.currentUser, isAdmin: (parsed.currentUser as any).isAdmin ?? (parsed.currentUser.id === '1'), email: parsed.currentUser.id === '1' ? adminEmail : parsed.currentUser.email } : null;
        return { ...parsed, users: migratedUsers, currentUser: migratedCurrent } as AppState;
      } catch (e) {
        console.error('Failed to parse saved state, using defaults', e);
      }
    }
    return {
      currentUser: null,
      users: INITIAL_USERS,
      categories: INITIAL_CATEGORIES,
      accounts: INITIAL_ACCOUNTS,
      transactions: [],
      recurringItems: []
    };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('finance_pro_state', JSON.stringify(state));
  }, [state]);

  const filteredTransactions = useMemo(() => state.transactions.filter(t => t.userId === state.currentUser?.id), [state.transactions, state.currentUser]);
  const filteredRecurring = useMemo(() => state.recurringItems.filter(r => r.userId === state.currentUser?.id), [state.recurringItems, state.currentUser]);

  const stats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

    const recurringIncome = filteredRecurring.filter(r => r.type === 'INCOME').reduce((acc, r) => acc + r.amount, 0);
    const recurringExpenses = filteredRecurring.filter(r => r.type === 'EXPENSE').reduce((acc, r) => acc + r.amount, 0);

    const initialAccBalance = state.accounts.reduce((acc, a) => acc + a.initialBalance, 0);
    return {
      totalIncome: income + recurringIncome,
      totalExpense: expenses + recurringExpenses,
      balance: initialAccBalance + income - expenses + recurringIncome - recurringExpenses
    };
  }, [filteredTransactions, filteredRecurring, state.accounts]);

  // Transactions
  const addTransaction = (t: Omit<Transaction, 'id' | 'userId'>) => {
    const newTransaction: Transaction = { ...t, id: Math.random().toString(36).substr(2, 9), userId: state.currentUser?.id || '1' };
    setState(prev => ({ ...prev, transactions: [newTransaction, ...prev.transactions] }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  // Recurring
  const addRecurring = (r: Omit<RecurringItem, 'id' | 'userId'>) => {
    const newItem: RecurringItem = { ...r, id: Math.random().toString(36).substr(2, 9), userId: state.currentUser?.id || '1' };
    setState(prev => ({ ...prev, recurringItems: [...prev.recurringItems, newItem] }));
  };

  const updateRecurring = (id: string, updates: Partial<RecurringItem>) => {
    setState(prev => ({ ...prev, recurringItems: prev.recurringItems.map(r => r.id === id ? { ...r, ...updates } : r) }));
  };

  const deleteRecurring = (id: string) => {
    setState(prev => ({ ...prev, recurringItems: prev.recurringItems.filter(r => r.id !== id) }));
  };

  const updateSettings = (updates: Partial<AppState>) => setState(prev => ({ ...prev, ...updates }));

  // User helpers
  const switchUser = (user: User) => { setState(prev => ({ ...prev, currentUser: user })); setUserMenuOpen(false); };
  const setUserPassword = (userId: string, passwordHash: string) => setState(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, passwordHash } : u) }));
  const addUser = (u: { name: string; username?: string; email: string; passwordHash?: string }) => {
    const newUser: User = { id: Math.random().toString(36).substr(2, 9), name: u.name, username: u.username, email: u.email, active: true, isAdmin: false, ...(u.passwordHash ? { passwordHash: u.passwordHash } : {}) };
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  if (!state.currentUser) {
    return <Login users={state.users} onLogin={switchUser} onSetUserPassword={setUserPassword} onAddUser={addUser} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} transactions={filteredTransactions} recurringItems={filteredRecurring} categories={state.categories} />;
      case 'transactions': return <TransactionsView transactions={filteredTransactions} categories={state.categories} accounts={state.accounts} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} />;
      case 'recurring': return <RecurringView items={filteredRecurring} categories={state.categories} accounts={state.accounts} onAdd={addRecurring} onUpdate={updateRecurring} onDelete={deleteRecurring} />;
      case 'settings': return <SettingsView state={state} onUpdate={updateSettings} />;
      case 'reports': return <ReportsView transactions={filteredTransactions} recurringItems={filteredRecurring} categories={state.categories} />;
      default: return <Dashboard stats={stats} transactions={filteredTransactions} categories={state.categories} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'recurring', label: 'Recorrentes', icon: Repeat },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
    { id: 'settings', label: 'Parâmetros', icon: Settings }
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Wallet className="w-6 h-6 text-white" /></div>
          <span className="text-xl font-bold tracking-tight">FinancePro</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                <Icon className="w-5 h-5" />{item.label}
              </button>
            );
          })}
        </nav>

        <div className="sticky bottom-0 p-4 border-t border-slate-800 bg-slate-900">
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors group">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><UserIcon className="w-6 h-6" /></div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold truncate text-white">{state.currentUser?.name}</p>
                <p className="text-xs text-slate-300 truncate">{state.currentUser?.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                <div className="w-full text-left px-4 py-2 text-sm text-slate-300">
                  <div className="font-semibold">{state.currentUser?.name}</div>
                  <div className="text-xs text-slate-500">{state.currentUser?.email}</div>
                </div>
                <div className="border-t border-slate-700 mt-2 pt-2">
                  <button onClick={() => setState(prev => ({ ...prev, currentUser: null }))} className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-slate-700 hover:text-white">Sair</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden text-slate-500 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 capitalize">{menuItems.find(m => m.id === activeTab)?.label}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Saldo Atual</span>
              <span className={`text-lg font-bold ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.balance)}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
