
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as PieChartIcon, Pie } from 'recharts';
import { Transaction, Category, RecurringItem, User } from '../types';

interface DashboardProps {
  stats: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  categories: Category[];
  currentUser: User | null;
  users: User[];
  selectedUserIdForViewing: string | 'all';
  onChangeUserFilter: (userId: string | 'all') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, transactions, recurringItems, categories, currentUser, users, selectedUserIdForViewing, onChangeUserFilter }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Recalculate stats based on filtered data
  const recalculatedStats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

    const recurringIncome = recurringItems.filter(r => r.type === 'INCOME').reduce((acc, r) => acc + r.amount, 0);
    const recurringExpenses = recurringItems.filter(r => r.type === 'EXPENSE').reduce((acc, r) => acc + r.amount, 0);

    return {
      totalIncome: income + recurringIncome,
      totalExpense: expenses + recurringExpenses,
      balance: income - expenses + recurringIncome - recurringExpenses
    };
  }, [transactions, recurringItems]);

  // Combinar transações com recorrências do mês atual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const recurringForCurrentMonth = recurringItems.map(r => {
    // Cria uma data para o item recorrente usando o dia do mês atual
    const recurringDate = new Date(currentYear, currentMonth, r.dayOfMonth);
    return {
      id: `recurring-${r.id}`,
      date: recurringDate.toISOString().split('T')[0],
      description: r.description,
      categoryId: r.categoryId,
      type: r.type,
      amount: r.amount,
      isRecurring: true
    };
  });

  // Combinar e ordenar por data (mais recentes primeiro)
  const allTransactions = [...transactions, ...recurringForCurrentMonth].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const recentTransactions = allTransactions.slice(0, 5);

  // Chart Data Preparation - incluindo itens recorrentes
  const categoryData = categories
    .filter(c => c.type === 'EXPENSE')
    .map(c => {
      const transactionAmount = transactions
        .filter(t => t.categoryId === c.id && t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
      const recurringAmount = recurringItems
        .filter(r => r.categoryId === c.id && r.type === 'EXPENSE')
        .reduce((sum, r) => sum + r.amount, 0);
      return { name: c.name, value: transactionAmount + recurringAmount, color: c.color };
    })
    .filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayIncome = transactions
      .filter(t => t.date === dateStr && t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const dayExpense = transactions
      .filter(t => t.date === dateStr && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    // Adiciona distribuição diária dos itens recorrentes (sprecha pelo mês)
    const recurringIncomeDaily = recurringItems
      .filter(r => r.type === 'INCOME' && r.dayOfMonth === d.getDate())
      .reduce((sum, r) => sum + r.amount, 0);
    const recurringExpenseDaily = recurringItems
      .filter(r => r.type === 'EXPENSE' && r.dayOfMonth === d.getDate())
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      day: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      receita: dayIncome + recurringIncomeDaily,
      despesa: dayExpense + recurringExpenseDaily
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* User Filter for Admin */}
      {currentUser?.isAdmin && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-3">Filtrar por Usuário</label>
          <select 
            value={selectedUserIdForViewing} 
            onChange={(e) => onChangeUserFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">Todos os usuários (consolidado)</option>
            {users
              .filter(u => u.id !== currentUser.id)
              .map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))
            }
          </select>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Receitas</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(recalculatedStats.totalIncome)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Despesas</p>
              <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(recalculatedStats.totalExpense)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Saldo Líquido</p>
              <h3 className={`text-2xl font-bold ${recalculatedStats.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                {formatCurrency(recalculatedStats.balance)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Atividade Semanal
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" />
            Despesas por Categoria
          </h4>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChartIcon>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChartIcon>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm italic">Nenhuma despesa registrada.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-800">Lançamentos Recentes</h4>
          <button className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 transition-colors">
            Ver Todos
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        {t.description}
                        {(t as any).isRecurring && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">
                            Recorrente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
                        {cat?.name}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                  </tr>
                );
              })}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
