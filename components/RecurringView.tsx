
import React, { useState } from 'react';
import { Plus, Trash2, Repeat, X, Edit2 } from 'lucide-react';
import { RecurringItem, Category, Account, TransactionType } from '../types';

interface RecurringViewProps {
  items: RecurringItem[];
  categories: Category[];
  accounts: Account[];
  onAdd: (r: Omit<RecurringItem, 'id' | 'userId'>) => void;
  onUpdate: (id: string, r: Partial<RecurringItem>) => void;
  onDelete: (id: string) => void;
}

const RecurringView: React.FC<RecurringViewProps> = ({ items, categories, accounts, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState = {
    description: '',
    amount: '',
    dayOfMonth: 1,
    categoryId: categories[0]?.id || '',
    accountId: accounts[0]?.id || '',
    type: 'EXPENSE' as TransactionType,
    occurrences: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleEdit = (item: RecurringItem) => {
    setEditingId(item.id);
    setFormData({
      description: item.description,
      amount: item.amount.toString(),
      dayOfMonth: item.dayOfMonth,
      categoryId: item.categoryId,
      accountId: item.accountId,
      type: item.type,
      occurrences: item.occurrences?.toString() || ''
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
    const numeric = {
      ...formData,
      amount: parseFloat(formData.amount),
      occurrences: formData.occurrences ? parseInt(formData.occurrences) : undefined,
    };
    if (editingId) {
      onUpdate(editingId, numeric);
    } else {
      // include startDate for new items
      onAdd({ ...numeric, startDate: new Date().toISOString() });
    }
    setModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500 text-sm">Gerencie pagamentos e recebimentos fixos mensais.</p>
        <button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-indigo-600/20 text-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Recorrência
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => {
          const cat = categories.find(c => c.id === item.categoryId);
          const acc = accounts.find(a => a.id === item.accountId);
          return (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative pr-24">
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  <Repeat className="w-5 h-5" />
                </div>
                <div className="bg-indigo-600 text-white rounded-xl px-3 py-2 text-center flex-shrink-0">
                  <p className="text-xs font-bold uppercase tracking-widest leading-none">Dia</p>
                  <p className="text-lg font-black">{item.dayOfMonth}</p>
                </div>
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-2 line-clamp-2">{item.description}</h4>
              <div className="flex items-center gap-2 mb-3">
                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
                  {cat?.name}
                </span>
                <span className="text-xs text-slate-400">• {acc?.name}</span>
              </div>
              <div className="pt-3 border-t border-slate-50">
                <p className={`text-lg font-black ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(item.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Recorrência' : 'Configurar Recorrência'}</h3>
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
                  DESPESA FIXA
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'INCOME'})}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all shadow-sm ${formData.type === 'INCOME' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                >
                  RECEITA FIXA
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
                    placeholder="Ex: Aluguel, Salário, Internet..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Valor Mensal</label>
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Dia de Cobrança</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      max="31"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium transition-all"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({...formData, dayOfMonth: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Parcelas (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium transition-all"
                    value={formData.occurrences}
                    onChange={(e) => setFormData({...formData, occurrences: e.target.value})}
                    placeholder="quantidade de meses para repetir"
                  />
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
                  {editingId ? 'Confirmar Edição' : 'Confirmar Recorrência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringView;
