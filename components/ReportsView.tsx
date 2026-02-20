import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction, Category, RecurringItem, User, Account } from '../types';

interface ReportsViewProps {
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

const ReportsView: React.FC<ReportsViewProps> = ({ 
  transactions, recurringItems, categories, accounts, currentUser, users, 
  selectedUserIdForViewing, onChangeUserFilter,
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear 
}) => {

  const monthsLabels = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const yearsOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Filtro de dados centralizado para o período e usuário selecionados
  // (Usado nos cards de Maiores Gastos e Eficiência)
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

  // Agregação de dados para o gráfico de evolução (Últimos 6 meses a partir da data selecionada)
  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, { month: string, receita: number, despesa: number }> = {};

    const getKeyForTransaction = (dateStr: string, accountId: string) => {
      const acc = accounts.find(a => a.id === accountId);
      const date = new Date(dateStr);
      if (acc?.type === 'CREDIT' && acc.dueDay) {
        let month = date.getMonth();
        let year = date.getFullYear();
        if (date.getDate() > acc.dueDay) {
          month += 1;
          if (month > 11) { month = 0; year += 1; }
        }
        return `${year}-${(month + 1).toString().padStart(2, '0')}`;
      }
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };
    
    // Gerar chaves para os 6 meses terminando no mês/ano selecionado
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthsMap[key] = {
        month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receita: 0,
        despesa: 0
      };
    }

    // Filtrar transações por usuário antes de agregar
    const userTransactions = transactions.filter(t => 
      currentUser?.isAdmin ? (selectedUserIdForViewing === 'all' || t.userId === selectedUserIdForViewing) : t.userId === currentUser?.id
    );

    userTransactions.forEach(t => {
      const key = getKeyForTransaction(t.date, t.accountId);
      if (monthsMap[key]) {
        if (t.type === 'INCOME') monthsMap[key].receita += t.amount;
        else monthsMap[key].despesa += t.amount;
      }
    });

    const userRecurring = recurringItems.filter(r => 
      currentUser?.isAdmin ? (selectedUserIdForViewing === 'all' || r.userId === selectedUserIdForViewing) : r.userId === currentUser?.id
    );

    Object.keys(monthsMap).forEach(key => {
      const [yearStr, monthStr] = key.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10) - 1;

      userRecurring.forEach(r => {
        const start = r.startDate ? new Date(r.startDate) : null;
        if (start) {
          const diff = (y - start.getFullYear()) * 12 + (m - start.getMonth());
          const isActive = diff >= 0 && (r.occurrences === undefined || diff < r.occurrences);
          
          if (isActive) {
            const acc = accounts.find(a => a.id === r.accountId);
            let effectiveKey = key;
            if (acc?.type === 'CREDIT' && acc.dueDay) {
              const date = new Date(y, m, r.dayOfMonth);
              effectiveKey = getKeyForTransaction(date.toISOString().split('T')[0], r.accountId);
            }
            if (monthsMap[effectiveKey]) {
              if (r.type === 'INCOME') monthsMap[effectiveKey].receita += r.amount;
              else monthsMap[effectiveKey].despesa += r.amount;
            }
          }
        }
      });
    });

    return Object.values(monthsMap);
  }, [transactions, recurringItems, accounts, selectedMonth, selectedYear, currentUser, selectedUserIdForViewing]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* BARRA DE FILTROS (Igual ao Dashboard) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end text-left">
        {currentUser?.isAdmin && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-2">Usuário</label>
            <select 
              value={selectedUserIdForViewing} 
              onChange={(e) => onChangeUserFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="all">Todos os usuários</option>
              {users.filter(u => u.id !== currentUser.id).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Mês</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            {monthsLabels.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Ano</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            {yearsOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gráfico de Evolução Mensal */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-8 text-left">Evolução Mensal (Últimos 6 meses até {monthsLabels[selectedMonth]})</h3>
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
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Maiores Gastos por Categoria */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 text-left">Maiores Gastos ({monthsLabels[selectedMonth]})</h3>
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
                     <p className="text-slate-500 font-medium">Margem de Poupança em {monthsLabels[selectedMonth]}</p>
                     <p className="text-xs text-slate-400 px-8">Quanto maior a porcentagem, mais você está guardando de sua receita total.</p>
                   </div>
                 );
               }
               return <p className="text-slate-400 italic">Sem receitas em {monthsLabels[selectedMonth]} para calcular.</p>
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;