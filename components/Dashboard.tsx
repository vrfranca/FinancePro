import React, { useMemo } from 'react';
import { Calendar, PieChart, TrendingUp, Wallet } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart as PieChartIcon, Pie, Legend 
} from 'recharts';
import { Transaction, Category, RecurringItem, User, Account } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  categories: Category[];
  accounts: Account[];
  currentUser: User | null;
  users: User[];
  selectedUserIdForViewing: string | 'all';
  onChangeUserFilter: (userId: string | 'all') => void;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, recurringItems, categories, accounts, currentUser, users, 
  selectedUserIdForViewing, onChangeUserFilter,
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear 
}) => {

  const monthsLabels = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const yearsOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // 1. Filtro de dados centralizado
  const filteredData = useMemo(() => {
    const filterByDateAndUser = (item: any) => {
      const matchesUser = currentUser?.isAdmin 
        ? (selectedUserIdForViewing === 'all' || item.userId === selectedUserIdForViewing)
        : item.userId === currentUser?.id;

      if (item.date) {
        const d = new Date(item.date);
        return matchesUser && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }
      
      if (item.startDate) {
        const start = new Date(item.startDate);
        const diff = (selectedYear - start.getFullYear()) * 12 + (selectedMonth - start.getMonth());
        const isActive = diff >= 0 && (item.occurrences === undefined || diff < item.occurrences);
        return matchesUser && isActive;
      }
      return matchesUser;
    };

    return {
      transactions: transactions.filter(filterByDateAndUser),
      recurringItems: recurringItems.filter(filterByDateAndUser)
    };
  }, [transactions, recurringItems, currentUser, selectedUserIdForViewing, selectedMonth, selectedYear]);

  // 2. Despesas por Categoria (Pizza)
  const categoryExpenseData = useMemo(() => {
    return categories
      .filter(c => c.type === 'EXPENSE')
      .map(c => {
        const val = filteredData.transactions.filter(t => t.categoryId === c.id && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0) +
                    filteredData.recurringItems.filter(r => r.categoryId === c.id && r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
        return { name: c.name, value: val, color: c.color };
      })
      .filter(d => d.value > 0);
  }, [categories, filteredData]);

  // 3. Receitas por Conta (Pizza)
  const accountIncomeData = useMemo(() => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
    return accounts
      .filter(acc => currentUser?.isAdmin ? (selectedUserIdForViewing === 'all' || acc.userId === selectedUserIdForViewing) : acc.userId === currentUser?.id)
      .map((acc, idx) => {
        const val = filteredData.transactions.filter(t => t.accountId === acc.id && t.type === 'INCOME').reduce((s, t) => s + t.amount, 0) +
                    filteredData.recurringItems.filter(r => r.accountId === acc.id && r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
        return { name: acc.name, value: val, color: colors[idx % colors.length] };
      })
      .filter(d => d.value > 0);
  }, [accounts, filteredData, currentUser, selectedUserIdForViewing]);

  // 4. Atividade Diária (Tipo Area - igual ao ReportsView)
  const dailyActivityData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const dayIncome = filteredData.transactions.filter(t => new Date(t.date).getDate() === day && t.type === 'INCOME').reduce((s, t) => s + t.amount, 0) +
                        filteredData.recurringItems.filter(r => r.dayOfMonth === day && r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
      const dayExpense = filteredData.transactions.filter(t => new Date(t.date).getDate() === day && t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0) +
                         filteredData.recurringItems.filter(r => r.dayOfMonth === day && r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
      return { 
        day: `Dia ${day}`, 
        receita: dayIncome, 
        despesa: dayExpense 
      };
    });
  }, [filteredData, selectedMonth, selectedYear]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* FILTROS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Mês</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            {monthsLabels.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Ano</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* GRÁFICOS SUPERIORES (PIZZA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 text-left"><PieChart className="w-5 h-5 text-rose-500" /> Despesas por Categoria</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChartIcon>
                <Pie data={categoryExpenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryExpenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChartIcon>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 text-left"><Wallet className="w-5 h-5 text-emerald-500" /> Receitas por Conta</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChartIcon>
                <Pie data={accountIncomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {accountIncomeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChartIcon>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GRÁFICO INFERIOR (AREA) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 text-left">
          <TrendingUp className="w-5 h-5 text-indigo-500" /> Fluxo de Caixa Diário - {monthsLabels[selectedMonth]}
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyActivityData}>
              <defs>
                <linearGradient id="colorIncomeDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenseDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" height={36} />
              <Area 
                name="Receita" 
                type="monotone" 
                dataKey="receita" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorIncomeDash)" 
                strokeWidth={3} 
              />
              <Area 
                name="Despesa" 
                type="monotone" 
                dataKey="despesa" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorExpenseDash)" 
                strokeWidth={3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;