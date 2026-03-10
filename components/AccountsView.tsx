import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, Edit2, X } from 'lucide-react';
import { Account, TransactionType } from '../types';

interface AccountsViewProps {
  accounts: Account[];
  onAdd: (a: Omit<Account, 'id' | 'userId'>) => void;
  onUpdate: (id: string, a: Partial<Account>) => void;
  onDelete: (id: string) => void;
}

const AccountsView: React.FC<AccountsViewProps> = ({ accounts, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; initialBalance: string; type: 'CASH'|'BANK'|'CREDIT'; dueDay?: string }>({ name: '', initialBalance: '0', type: 'BANK' });

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', initialBalance: '0', type: 'BANK' });
    setModalOpen(true);
  };

  const handleEdit = (acc: Account) => {
    setEditingId(acc.id);
    setFormData({ name: acc.name, initialBalance: acc.initialBalance.toString(), type: acc.type, dueDay: acc.dueDay?.toString() });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericBal = parseFloat(formData.initialBalance);
    const due = formData.dueDay ? parseInt(formData.dueDay) : undefined;

    // Criamos o objeto seguindo o "contrato" da interface Account
    const data: Omit<Account, 'id' | 'userId'> = { 
      name: formData.name, 
      type: formData.type, 
      initialBalance: numericBal,
      startDate: new Date().toISOString().split('T')[0], // <-- ADICIONE ESTA LINHA (formato YYYY-MM-DD)
      ...(formData.type === 'CREDIT' && due ? { dueDay: due } : {}) 
    };

    if (editingId) onUpdate(editingId, data);
    else onAdd(data);
    
    setModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500 text-sm">Gerencie suas contas e limites de cartão.</p>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-indigo-600/20 text-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Conta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-700 text-sm">{acc.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  {acc.type === 'CREDIT' ? 'Cartão' : acc.type === 'BANK' ? 'Banco' : 'Carteira'}{' '}
                  • Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.initialBalance)}
                  {acc.type === 'CREDIT' && acc.dueDay ? ` • venc: dia ${acc.dueDay}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => handleEdit(acc)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(acc.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Editar Conta' : 'Nova Conta'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nome</label>
                <input required type="text" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tipo de Conta</label>
                <select
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="CASH">Carteira</option>
                  <option value="BANK">Banco</option>
                  <option value="CREDIT">Cartão de Crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  {formData.type === 'CREDIT' ? 'Limite do Cartão' : 'Saldo Inicial'}
                </label>
                <input required type="number" step="0.01" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={formData.initialBalance} onChange={e => setFormData({...formData, initialBalance: e.target.value})} />
              </div>
              {formData.type === 'CREDIT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                    value={formData.dueDay || ''}
                    onChange={e => setFormData({...formData, dueDay: e.target.value})}
                  />
                </div>
              )}
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsView;
