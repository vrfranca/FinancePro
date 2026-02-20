
import React, { useState } from 'react';
import { Plus, Trash2, Search, Filter, X, Edit2 } from 'lucide-react';
import { Transaction, Category, Account, TransactionType } from '../types';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onAdd: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  onUpdate: (id: string, t: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, categories, accounts, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  // helper used in table and grouping: for credit card accounts use dueDay to shift
  // transaction to the billing month
  const getDueMonth = (t: Transaction) => {
    const acc = accounts.find(a => a.id === t.accountId);
    if (acc?.type === 'CREDIT' && acc.dueDay) {
      const date = new Date(t.date);
      let month = date.getMonth();
      let year = date.getFullYear();
      if (date.getDate() > acc.dueDay) {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
      }
      return `${year}-${(month+1).toString().padStart(2,'0')}`;
    }
    return '';
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };
    if (editingId) {
      onUpdate(editingId, data);
    } else {
      onAdd(data);
    }
    setFormData(initialFormState);
    setModalOpen(false);
    setEditingId(null);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar lançamentos..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-indigo-600/20 text-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Novo Lançamento
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Conta</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const acc = accounts.find(a => a.id === t.accountId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{t.description}</p>
                      {t.isRecurring && <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">Recorrente</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{acc?.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {acc?.type === 'CREDIT' ? getDueMonth(t) : ''}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
                        {cat?.name}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'EXPENSE'})}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm ${formData.type === 'EXPENSE' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                >
                  DESPESA
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'INCOME'})}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm ${formData.type === 'INCOME' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                >
                  RECEITA
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Descrição</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium transition-all"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Ex: Supermercado, Aluguel..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Valor</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold transition-all"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Data</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium transition-all"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Categoria</label>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium transition-all"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    >
                      {categories.filter(c => c.type === formData.type).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Conta</label>
                    <select 
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium transition-all"
                      value={formData.accountId}
                      onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}{a.type === 'CREDIT' && a.dueDay ? ` (venc: ${a.dueDay})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                >
                  {editingId ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsView;
