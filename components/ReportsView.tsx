
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Transaction, Category } from '../types';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions, categories }) => {
  // Aggregate data by month
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string, receita: number, despesa: number }> = {};
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      months[key] = {
        month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receita: 0,
        despesa: 0
      };
    }

    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (months[key]) {
        if (t.type === 'INCOME') months[key].receita += t.amount;
        else months[key].despesa += t.amount;
      }
    });

    return Object.values(months);
  }, [transactions]);

  function useMemo<T>(factory: () => T, deps: any[]): T {
    return React.useMemo(factory, deps);
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-8">Evolução Mensal (Últimos 6 meses)</h3>
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
              <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="receita" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
              <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Maiores Gastos por Categoria</h3>
          <div className="space-y-4">
            {categories
              .filter(c => c.type === 'EXPENSE')
              .map(c => {
                const total = transactions
                  .filter(t => t.categoryId === c.id)
                  .reduce((sum, t) => sum + t.amount, 0);
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
                        width: `${Math.min(100, (item.amount / monthlyData.reduce((acc, curr) => acc + curr.despesa, 0)) * 100)}%`,
                        backgroundColor: item.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Eficiência Financeira</h3>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            {monthlyData.length > 0 && monthlyData[monthlyData.length - 1].receita > 0 ? (
              <div className="space-y-2">
                <div className="text-5xl font-black text-indigo-600">
                  {Math.round((1 - (monthlyData[monthlyData.length - 1].despesa / monthlyData[monthlyData.length - 1].receita)) * 100)}%
                </div>
                <p className="text-slate-500 font-medium">Margem de Poupança este Mês</p>
                <p className="text-xs text-slate-400 px-8">Quanto maior a porcentagem, mais você está guardando de sua receita total.</p>
              </div>
            ) : (
              <p className="text-slate-400 italic">Dados insuficientes para calcular.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
