import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import { Transaction, Category, RecurringItem, User, Account } from '../types';

interface ReportsViewProps {
  stats: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    openCreditTotal: number;
    projectedBalance: number;
  };
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

const ReportsView: React.FC<ReportsViewProps> = ({
  stats, transactions, recurringItems, categories, accounts, 
  currentUser, users, selectedUserIdForViewing, onChangeUserFilter,
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear
}) => {

  const monthsLabels = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  /* ==========================================
     YEARS OPTIONS (SEM new Date)
  ========================================== */
  const yearsOptions = useMemo(() => {

    const currentYear = new Date().getFullYear();
    const allItems = [...transactions, ...recurringItems];

    const yearsFromData = allItems
      .filter(item =>
        currentUser?.isAdmin
          ? (selectedUserIdForViewing === 'all' || item.userId === selectedUserIdForViewing)
          : item.userId === currentUser?.id
      )
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

    const minYear = yearsFromData.length > 0
      ? Math.min(...yearsFromData)
      : currentYear;

    const startYear = Math.min(currentYear, minYear);

    const years: number[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push(y);
    }

    return years;

  }, [transactions, recurringItems, currentUser, selectedUserIdForViewing]);


  /* ==========================================
     FILTRO MÊS/ANO (SEM Date)
  ========================================== */
  const filteredData = useMemo(() => {

    const filterByDateAndUser = (item: any) => {

      const matchesUser = currentUser?.isAdmin
        ? (selectedUserIdForViewing === 'all' || item.userId === selectedUserIdForViewing)
        : item.userId === currentUser?.id;

      if (!matchesUser) return false;

      if (item.date) {
        const [year, month] = item.date.split("-").map(Number);
        return year === selectedYear && month === selectedMonth;
      }

      if (item.startDate) {
        const [startYear, startMonth] = item.startDate.split("-").map(Number);

        const diff =
          (selectedYear - startYear) * 12 +
          (selectedMonth - startMonth);

        return diff >= 0 &&
               (item.occurrences === undefined || diff < item.occurrences);
      }

      return false;
    };

    return {
      transactions: transactions.filter(filterByDateAndUser),
      recurringItems: recurringItems.filter(filterByDateAndUser)
    };

  }, [transactions, recurringItems, currentUser, selectedUserIdForViewing, selectedMonth, selectedYear]);


  /* ==========================================
      EVOLUÇÃO MENSAL (6 MESES) - CORREÇÃO DE TIPO
  ========================================== */
  const monthlyData = useMemo(() => {
    // Definimos a interface aqui ou usamos um tipo inline para o Record
    const monthsMap: Record<string, { month: string, receita: number, despesa: number, saldo: number }> = {};

    const pad = (n: number) => n.toString().padStart(2, '0');

    for (let i = 5; i >= 0; i--) {
      let month = selectedMonth - i;
      let year = selectedYear;

      while (month <= 0) {
        month += 12;
        year -= 1;
      }

      const key = `${year}-${pad(month)}`;

      // Agora incluímos o 'saldo' na inicialização com valor 0
      monthsMap[key] = {
        month: `${monthsLabels[month - 1].substring(0,3)}/${year.toString().slice(-2)}`,
        receita: 0,
        despesa: 0,
        saldo: 0 // <-- Adicionado aqui
      };
    }

    const userTransactions = transactions.filter(t =>
      currentUser?.isAdmin
        ? (selectedUserIdForViewing === 'all' || t.userId === selectedUserIdForViewing)
        : t.userId === currentUser?.id
    );

    userTransactions.forEach(t => {

      const [yearStr, monthStr] = t.date.split("-");
      const key = `${yearStr}-${monthStr}`;

      if (monthsMap[key]) {
        if (t.type === 'INCOME') monthsMap[key].receita += t.amount;
        else monthsMap[key].despesa += t.amount;
      }
    });

    const userRecurring = recurringItems.filter(r =>
      currentUser?.isAdmin
        ? (selectedUserIdForViewing === 'all' || r.userId === selectedUserIdForViewing)
        : r.userId === currentUser?.id
    );

    Object.keys(monthsMap).forEach(key => {

      const [yearStr, monthStr] = key.split("-");
      const y = Number(yearStr);
      const m = Number(monthStr);

      userRecurring.forEach(r => {

        if (!r.startDate) return;

        const [startYear, startMonth] = r.startDate.split("-").map(Number);

        const diff =
          (y - startYear) * 12 +
          (m - startMonth);

        if (diff >= 0 && (r.occurrences === undefined || diff < r.occurrences)) {
          if (r.type === 'INCOME') monthsMap[key].receita += r.amount;
          else monthsMap[key].despesa += r.amount;
        }

      });
    });

    const orderedMonths = Object.values(monthsMap);

      let runningBalance = 0;

      orderedMonths.forEach(m => {
        runningBalance += m.receita - m.despesa;
        m.saldo = runningBalance;
      });

      return orderedMonths;

  }, [transactions, recurringItems, selectedMonth, selectedYear, currentUser, selectedUserIdForViewing]);


  /* ==========================================
     RENDER
  ========================================== */
  return (
    <div className="space-y-8 max-w-6xl mx-auto">

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

      {/* Gráfico de Evolução Mensal */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-8 text-left">Evolução Mensal (Últimos 6 meses até {monthsLabels[selectedMonth - 1]})</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="receita" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
              <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
              <Area type="monotone" dataKey="saldo" stroke="#6366f1" fillOpacity={0} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Maiores Gastos por Categoria */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 text-left">Maiores Gastos ({monthsLabels[selectedMonth - 1]})</h3>
          <div className="space-y-4 text-left">
            {categories
              .filter(c => c.type === 'EXPENSE')
              .map(c => {
                const transactionTotal = filteredData.transactions
                  .filter(t => t.categoryId === c.id && t.type === 'EXPENSE')
                  .reduce((sum, t) => sum + t.amount, 0);
                const recurringTotal = filteredData.recurringItems
                  .filter(r => r.categoryId === c.id && r.type === 'EXPENSE')
                  .reduce((sum, r) => sum + r.amount, 0);
                const total = transactionTotal + recurringTotal;
                return { name: c.name, amount: total, color: c.color };
              })
              .sort((a, b) => b.amount - a.amount)
              .filter(d => d.amount > 0)
              .slice(0, 5)
              .map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">{item.name}</span>
                    <span className="font-bold text-slate-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, (item.amount / filteredData.transactions.concat(filteredData.recurringItems as any).reduce((acc: any, curr: any) => curr.type === 'EXPENSE' ? acc + curr.amount : acc, 0)) * 100)}%`,
                        backgroundColor: item.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Eficiência Financeira */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 text-left">Eficiência Financeira</h3>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            {(() => {
               const receitaTotal = filteredData.transactions.filter(t => t.type === 'INCOME').reduce((s,t) => s + t.amount, 0) +
                                   filteredData.recurringItems.filter(r => r.type === 'INCOME').reduce((s,r) => s + r.amount, 0);
               const despesaTotal = filteredData.transactions.filter(t => t.type === 'EXPENSE').reduce((s,t) => s + t.amount, 0) +
                                   filteredData.recurringItems.filter(r => r.type === 'EXPENSE').reduce((s,r) => s + r.amount, 0);
               
               if (receitaTotal > 0) {
                 const margem = Math.round((1 - (despesaTotal / receitaTotal)) * 100);
                 return (
                   <div className="space-y-2">
                     <div className={`text-5xl font-black ${margem >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                       {margem}%
                     </div>
                     <p className="text-slate-500 font-medium">Margem de Poupança em {monthsLabels[selectedMonth - 1]}</p>
                     <p className="text-xs text-slate-400 px-8">Quanto maior a porcentagem, mais você está guardando de sua receita total.</p>
                   </div>
                 );
               }
               return <p className="text-slate-400 italic">Sem receitas em {monthsLabels[selectedMonth - 1]} para calcular.</p>
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;