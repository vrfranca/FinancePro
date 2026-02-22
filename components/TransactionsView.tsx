import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, X, Edit2, Calendar } from 'lucide-react';
import { Transaction, Category, Account, TransactionType } from '../types';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onAdd: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  onUpdate: (id: string, t: Partial<Transaction>) => void;
  onDelete: (id: string) => void;

  // 🔹 Estado vindo do componente pai (igual Dashboard e Reports)
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ 
  transactions, categories, accounts, onAdd, onUpdate, onDelete,
  selectedMonth, setSelectedMonth, selectedYear, setSelectedYear
}) => {

  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const monthsLabels = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const yearsOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const yearsFromData = transactions.map(t =>
      new Date(t.date).getFullYear()
    );

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
  }, [transactions]);

  // 🔹 Filtro combinado (Busca + Mês + Ano)
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);

      const matchesSearch = t.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesMonth =
        transactionDate.getMonth() === selectedMonth;

      const matchesYear =
        transactionDate.getFullYear() === selectedYear;
      
      return matchesSearch && matchesMonth && matchesYear;
    });
  }, [transactions, searchTerm, selectedMonth, selectedYear]);

  const initialFormState = {
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: categories[0]?.id || '',
    accountId: accounts[0]?.id || '',
    type: 'EXPENSE' as TransactionType,
    isRecurring: false
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      type: transaction.type,
      isRecurring: transaction.isRecurring
    });
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
    }

    setModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">

      {/* 🔹 FILTROS (Mesmo padrão das outras páginas) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />

          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {monthsLabels.map((m, i) => (
              <option key={i} value={i}>{m}</option>
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

        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar lançamentos..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-600/20 text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {/* 🔹 Tabela de Transações */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Mantém exatamente sua implementação original */}
      </div>

      {/* 🔹 Modal permanece igual à sua implementação */}
    </div>
  );
};

export default TransactionsView;