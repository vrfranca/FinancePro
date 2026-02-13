
import React, { useState } from 'react';
import { Plus, Trash2, Tag, CreditCard, Users as UsersIcon, Edit2, X } from 'lucide-react';
import { AppState, Category, Account, User, TransactionType } from '../types';

interface SettingsViewProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ state, onUpdate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'accounts' | 'users'>('categories');
  const [modalType, setModalType] = useState<'category' | 'account' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Modal Form State
  // Fix: Explicitly type catForm to use TransactionType instead of string to prevent type mismatch on spread
  const [catForm, setCatForm] = useState<{ name: string; type: TransactionType; color: string }>({ 
    name: '', 
    type: 'EXPENSE', 
    color: '#ef4444' 
  });
  const [accForm, setAccForm] = useState({ name: '', initialBalance: '0' });

  const handleOpenCatModal = (item?: Category) => {
    if (item) {
      setEditingItem(item);
      setCatForm({ name: item.name, type: item.type, color: item.color });
    } else {
      setEditingItem(null);
      setCatForm({ name: '', type: 'EXPENSE', color: '#ef4444' });
    }
    setModalType('category');
  };

  const handleOpenAccModal = (item?: Account) => {
    if (item) {
      setEditingItem(item);
      setAccForm({ name: item.name, initialBalance: item.initialBalance.toString() });
    } else {
      setEditingItem(null);
      setAccForm({ name: '', initialBalance: '0' });
    }
    setModalType('account');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      // Fix: Spread catForm into existing category; now safe since catForm.type is TransactionType
      onUpdate({
        categories: state.categories.map(c => c.id === editingItem.id ? { ...c, ...catForm } : c)
      });
    } else {
      const newCat: Category = {
        id: Math.random().toString(36).substr(2, 9),
        name: catForm.name,
        type: catForm.type,
        color: catForm.color
      };
      onUpdate({ categories: [...state.categories, newCat] });
    }
    setModalType(null);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate({
        accounts: state.accounts.map(a => a.id === editingItem.id ? { ...a, name: accForm.name, initialBalance: parseFloat(accForm.initialBalance) } : a)
      });
    } else {
      const newAcc: Account = {
        id: Math.random().toString(36).substr(2, 9),
        name: accForm.name,
        type: 'BANK',
        initialBalance: parseFloat(accForm.initialBalance)
      };
      onUpdate({ accounts: [...state.accounts, newAcc] });
    }
    setModalType(null);
  };

  const removeCategory = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    onUpdate({ categories: state.categories.filter(c => c.id !== id) });
  };

  const removeAccount = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    onUpdate({ accounts: state.accounts.filter(a => a.id !== id) });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex border-b border-slate-200">
        {[
          { id: 'categories', label: 'Categorias', icon: Tag },
          { id: 'accounts', label: 'Contas', icon: CreditCard },
          { id: 'users', label: 'Usuários', icon: UsersIcon },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2
              ${activeSubTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeSubTab === 'categories' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Categorias Base</h3>
              <button onClick={() => handleOpenCatModal()} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-100 transition-colors">
                <Plus className="w-4 h-4" /> Adicionar Categoria
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{cat.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{cat.type === 'INCOME' ? 'Receita' : 'Despesa'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleOpenCatModal(cat)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeCategory(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'accounts' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Contas e Bancos</h3>
              <button onClick={() => handleOpenAccModal()} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-100 transition-colors">
                <Plus className="w-4 h-4" /> Adicionar Conta
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.accounts.map(acc => (
                <div key={acc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Saldo Inicial: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.initialBalance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleOpenAccModal(acc)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeAccount(acc.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'users' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Gestão de Usuários</h3>
              <p className="text-sm text-slate-400">Apenas leitura na versão demo.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {state.users.map(u => (
                <div key={u.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-full tracking-wider">Ativo</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA CATEGORIAS */}
      {modalType === 'category' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">{editingItem ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nome</label>
                <input required type="text" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCatForm({...catForm, type: 'EXPENSE', color: '#ef4444'})} className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${catForm.type === 'EXPENSE' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>DESPESA</button>
                  <button type="button" onClick={() => setCatForm({...catForm, type: 'INCOME', color: '#10b981'})} className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${catForm.type === 'INCOME' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>RECEITA</button>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CONTAS */}
      {modalType === 'account' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">{editingItem ? 'Editar Conta' : 'Nova Conta'}</h3>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nome do Banco / Carteira</label>
                <input required type="text" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900" value={accForm.name} onChange={e => setAccForm({...accForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Saldo Inicial</label>
                <input required type="number" step="0.01" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-bold" value={accForm.initialBalance} onChange={e => setAccForm({...accForm, initialBalance: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
