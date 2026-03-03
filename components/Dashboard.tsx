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
  selectedMonth: number; // 1–12
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

  /* ================================
     YEARS OPTIONS (SEM new Date)
  ==================================*/
  const yearsOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const allItems = [...transactions, ...recurringItems];

    const yearsFromData = allItems
      .filter(item => {
        return currentUser?.isAdmin
          ? (selectedUserIdForViewing === 'all' || item.userId === selectedUserIdForViewing)
          : item.userId === currentUser?.id;
      })
      .map(item => {
        if ('date' in item && item.date) {
          const [year] = item.date.split("-");
          return Number(year);
        }
        if ('startDate' in item && item.startDate) {
          const [year] = item.startDate.split("-");
          return Number(year);
        }
        return currentYear;
      });

    const minYearFromData =
      yearsFromData.length > 0
        ? Math.min(...yearsFromData)
        : currentYear;

    const startYear = Math.min(currentYear, minYearFromData);

    const years: number[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push(y);
    }

    return years;
  }, [transactions, recurringItems, currentUser, selectedUserIdForViewing]);

  /* ================================
     FILTER DATA (SEM new Date)
  ==================================*/
  const filteredData = useMemo(() => {

    const filterByDateAndUser = (item: any) => {

      const matchesUser = currentUser?.isAdmin 
        ? (selectedUserIdForViewing === 'all' || item.userId === selectedUserIdForViewing)
        : item.userId === currentUser?.id;

      if (!matchesUser) return false;

      // TRANSAÇÕES NORMAIS
      if (item.date) {
        const [year, month] = item.date.split("-").map(Number);
        return year === selectedYear && month === selectedMonth;
      }

      // RECORRENTES
      if (item.startDate) {
        const [startYear, startMonth] = item.startDate.split("-").map(Number);

        const diff =
          (selectedYear - startYear) * 12 +
          (selectedMonth - startMonth);

        const isActive =
          diff >= 0 &&
          (item.occurrences === undefined || diff < item.occurrences);

        return isActive;
      }

      return false;
    };

    return {
      transactions: transactions.filter(filterByDateAndUser),
      recurringItems: recurringItems.filter(filterByDateAndUser)
    };

  }, [transactions, recurringItems, currentUser, selectedUserIdForViewing, selectedMonth, selectedYear]);

  /* ================================
     DESPESAS POR CATEGORIA
  ==================================*/
  const categoryExpenseData = useMemo(() => {

    const fallbackColors = [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#6366f1'
    ];

    return categories
      .filter(c => c.type === 'EXPENSE')
      .map((c, index) => {

        const value =
          filteredData.transactions
            .filter(t => t.categoryId === c.id && t.type === 'EXPENSE')
            .reduce((s, t) => s + t.amount, 0)
          +
          filteredData.recurringItems
            .filter(r => r.categoryId === c.id && r.type === 'EXPENSE')
            .reduce((s, r) => s + r.amount, 0);

        return {
          name: c.name,
          value,
          color: c.color || fallbackColors[index % fallbackColors.length]
        };
      })
      .filter(d => d.value > 0);

  }, [categories, filteredData]);

  /* ================================
     RECEITAS POR CONTA
  ==================================*/
  const accountIncomeData = useMemo(() => {

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

    return accounts
      .filter(acc =>
        acc.type !== 'CREDIT' &&
        (
          currentUser?.isAdmin
            ? (selectedUserIdForViewing === 'all' || acc.userId === selectedUserIdForViewing)
            : acc.userId === currentUser?.id
        )
      )
      .map((acc, idx) => {

        // ============================
        // 1️⃣ Verificar se saldo inicial
        // deve entrar no mês selecionado
        // ============================

        let initialValue = 0;

        if (acc.startDate) {
          const [startYear, startMonth] = acc.startDate.split("-").map(Number);

          if (startYear === selectedYear && startMonth === selectedMonth) {
            initialValue = acc.initialBalance;
          }
        }

        // ============================
        // 2️⃣ Receitas do mês
        // ============================

        const income =
          filteredData.transactions
            .filter(t => t.accountId === acc.id && t.type === 'INCOME')
            .reduce((s, t) => s + t.amount, 0)
          +
          filteredData.recurringItems
            .filter(r => r.accountId === acc.id && r.type === 'INCOME')
            .reduce((s, r) => s + r.amount, 0);

        const total = initialValue + income;

        return {
          name: acc.name,
          value: total,
          color: colors[idx % colors.length]
        };

      })
      .filter(d => d.value > 0);

  }, [
    accounts,
    filteredData,
    currentUser,
    selectedUserIdForViewing,
    selectedMonth,
    selectedYear
  ]);

  /* ================================
     FLUXO DIÁRIO (SEM new Date)
  ==================================*/
  const dailyActivityData = useMemo(() => {

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    // ============================
    // Saldo inicial do mês
    // ============================

    let startingBalance = 0;

    accounts.forEach(acc => {

      const belongsToUser =
        currentUser?.isAdmin
          ? (selectedUserIdForViewing === 'all' || acc.userId === selectedUserIdForViewing)
          : acc.userId === currentUser?.id;

      if (!belongsToUser) return;
      if (acc.type === 'CREDIT') return;

      if (acc.startDate) {
        const [startYear, startMonth] = acc.startDate.split("-").map(Number);

        if (startYear === selectedYear && startMonth === selectedMonth) {
          startingBalance += acc.initialBalance;
        }
      }
    });

    let runningBalance = startingBalance;

    return Array.from({ length: daysInMonth }).map((_, i) => {

      const day = i + 1;

      const dayIncome =
        filteredData.transactions
          .filter(t => {
            const [, , d] = t.date.split("-").map(Number);
            return d === day && t.type === 'INCOME';
          })
          .reduce((s, t) => s + t.amount, 0)
        +
        filteredData.recurringItems
          .filter(r => r.dayOfMonth === day && r.type === 'INCOME')
          .reduce((s, r) => s + r.amount, 0);

      const dayExpense =
        filteredData.transactions
          .filter(t => {
            const [, , d] = t.date.split("-").map(Number);
            return d === day && t.type === 'EXPENSE';
          })
          .reduce((s, t) => s + t.amount, 0)
        +
        filteredData.recurringItems
          .filter(r => r.dayOfMonth === day && r.type === 'EXPENSE')
          .reduce((s, r) => s + r.amount, 0);

      runningBalance += dayIncome - dayExpense;

      return {
        day: `Dia ${day}`,
        receita: dayIncome,
        despesa: dayExpense,
        saldo: runningBalance
      };

    });

  }, [
    accounts,
    filteredData,
    selectedMonth,
    selectedYear,
    currentUser,
    selectedUserIdForViewing
  ]);

  /* ================================
     RENDER
  ==================================*/
  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />

          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {monthsLabels.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>

          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {yearsOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* GRÁFICOS SUPERIORES (PIZZA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 text-left">
            <PieChart className="w-5 h-5 text-rose-500" /> Despesas por Categoria
          </h4>
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
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 text-left">
            <Wallet className="w-5 h-5 text-emerald-500" /> Receitas por Conta
          </h4>
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
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" align="right" height={36} />
              <Area name="Receita" type="monotone" dataKey="receita" stroke="#10b981" fillOpacity={1} fill="url(#colorIncomeDash)" strokeWidth={3} />
              <Area name="Despesa" type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenseDash)" strokeWidth={3} />
              <Area name="Saldo" type="monotone" dataKey="saldo" stroke="#6366f1" fillOpacity={0} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;