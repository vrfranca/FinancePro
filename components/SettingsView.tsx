
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

  // category/account forms
  const [catForm, setCatForm] = useState<{ name: string; type: TransactionType; color: string }>({ name: '', type: 'EXPENSE', color: '#ef4444' });
  const [accForm, setAccForm] = useState({ name: '', initialBalance: '0' });

  // users: add + password modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [addUserError, setAddUserError] = useState('');

  const [pwdModalUser, setPwdModalUser] = useState<User | null>(null);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwd1, setPwd1] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleOpenCatModal = (item?: Category) => {
    if (item) { setEditingItem(item); setCatForm({ name: item.name, type: item.type, color: item.color }); }
    else { setEditingItem(null); setCatForm({ name: '', type: 'EXPENSE', color: '#ef4444' }); }
    setModalType('category');
  };

  const handleOpenAccModal = (item?: Account) => {
    if (item) { setEditingItem(item); setAccForm({ name: item.name, initialBalance: item.initialBalance.toString() }); }
    else { setEditingItem(null); setAccForm({ name: '', initialBalance: '0' }); }
    setModalType('account');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) onUpdate({ categories: state.categories.map(c => c.id === editingItem.id ? { ...c, ...catForm } : c) });
    else onUpdate({ categories: [...state.categories, { id: Math.random().toString(36).substr(2,9), name: catForm.name, type: catForm.type, color: catForm.color }] });
    setModalType(null);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) onUpdate({ accounts: state.accounts.map(a => a.id === editingItem.id ? { ...a, name: accForm.name, initialBalance: parseFloat(accForm.initialBalance) } : a) });
    else onUpdate({ accounts: [...state.accounts, { id: Math.random().toString(36).substr(2,9), name: accForm.name, type: 'BANK', initialBalance: parseFloat(accForm.initialBalance) }] });
    setModalType(null);
  };

  const removeCategory = (id: string) => { if (!confirm('Tem certeza que deseja excluir esta categoria?')) return; onUpdate({ categories: state.categories.filter(c => c.id !== id) }); };
  const removeAccount = (id: string) => { if (!confirm('Tem certeza que deseja excluir esta conta?')) return; onUpdate({ accounts: state.accounts.filter(a => a.id !== id) }); };

  const submitAddUser = async () => {
    setAddUserError('');
    if (!newName.trim() || !newEmail.trim()) { setAddUserError('Nome e e-mail são obrigatórios'); return; }
    if (newPassword || newPassword2) {
      if (newPassword.length < 4) { setAddUserError('Senha deve ter ao menos 4 caracteres'); return; }
      if (newPassword !== newPassword2) { setAddUserError('Senhas não coincidem'); return; }
    }
    let passwordHash: string | undefined = undefined;
    if (newPassword) { const { hashPassword } = await import('../utils/auth'); passwordHash = await hashPassword(newPassword); }
    const newUser: User = { id: Math.random().toString(36).substr(2,9), name: newName, username: newUsername || undefined, email: newEmail, active: true, isAdmin: false, ...(passwordHash ? { passwordHash } : {}) };
    onUpdate({ users: [...state.users, newUser] });
    setShowAddUserModal(false); setNewName(''); setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewPassword2(''); setAddUserError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex border-b border-slate-200">
        {[ { id: 'categories', label: 'Categorias', icon: Tag }, { id: 'accounts', label: 'Contas', icon: CreditCard }, { id: 'users', label: 'Usuários', icon: UsersIcon } ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeSubTab === 'categories' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Categorias Base</h3>
              <button onClick={() => handleOpenCatModal()} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-100 transition-colors"><Plus className="w-4 h-4" /> Adicionar Categoria</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{state.categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all">
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} /><div><p className="font-bold text-slate-700 text-sm">{cat.name}</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{cat.type === 'INCOME' ? 'Receita' : 'Despesa'}</p></div></div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => { setEditingItem(cat); setModalType('category'); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button><button onClick={() => removeCategory(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}</div>
          </div>
        )}

        {activeSubTab === 'accounts' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Contas e Bancos</h3>
              <button onClick={() => handleOpenAccModal()} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-100 transition-colors"><Plus className="w-4 h-4" /> Adicionar Conta</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{state.accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-transparent hover:border-slate-200 transition-all"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm"><CreditCard className="w-5 h-5" /></div><div><p className="font-bold text-slate-700 text-sm">{acc.name}</p><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Saldo Inicial: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.initialBalance)}</p></div></div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => { setEditingItem(acc); setModalType('account'); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button><button onClick={() => removeAccount(acc.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button></div></div>
            ))}</div>
          </div>
        )}

        {activeSubTab === 'users' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Gestão de Usuários</h3>
              {state.currentUser?.isAdmin ? (<div><button onClick={() => setShowAddUserModal(true)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-100 transition-colors"><Plus className="w-4 h-4" /> Adicionar Usuário</button></div>) : (<p className="text-sm text-slate-400">Apenas leitura na versão demo.</p>)}
            </div>
            <div className="divide-y divide-slate-100">
              {(state.currentUser?.isAdmin ? state.users : state.users.filter(u => u.id === state.currentUser?.id)).map(u => (
                <div key={u.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UsersIcon className="w-6 h-6" /></div>
                    <div><p className="font-bold text-slate-800">{u.name}{u.isAdmin && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">ADMIN</span>}</p><p className="text-sm text-slate-500">{u.email}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPwdModalUser(u)} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[12px] font-bold uppercase rounded-full tracking-wider">Alterar senha</button>
                    {state.currentUser?.isAdmin ? (
                      <>
                        {!u.isAdmin ? (<button onClick={() => { const currentlyActive = u.active !== false; const targetState = !currentlyActive; if (!confirm(`Deseja realmente ${targetState ? 'ativar' : 'desativar'} o usuário ${u.name}?`)) return; const newUsers = state.users.map(x => x.id === u.id ? { ...x, active: targetState } : x); const updates: Partial<AppState> = { users: newUsers }; if (state.currentUser?.id === u.id && targetState === false) updates.currentUser = null; onUpdate(updates); }} className={`px-3 py-1 ${u.active === false ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'} text-[12px] font-bold uppercase rounded-full tracking-wider`}>{u.active === false ? 'Inativo' : 'Ativo'}</button>) : (<div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[12px] font-bold uppercase rounded-full tracking-wider">Ativo</div>)}
                        {!u.isAdmin && (<button onClick={() => { if (!confirm(`Deseja realmente excluir o usuário ${u.name} e todos os seus dados? Esta ação não pode ser desfeita.`)) return; const newUsers = state.users.filter(x => x.id !== u.id); const newTransactions = state.transactions.filter(t => t.userId !== u.id); const newRecurring = state.recurringItems.filter(r => r.userId !== u.id); const updates: Partial<AppState> = { users: newUsers, transactions: newTransactions, recurringItems: newRecurring }; if (state.currentUser?.id === u.id) updates.currentUser = null; onUpdate(updates); }} className="px-3 py-1 bg-rose-50 text-rose-600 text-[12px] font-bold uppercase rounded-full tracking-wider">Excluir</button>)}
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modalType === 'category' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">{editingItem ? 'Editar Categoria' : 'Nova Categoria'}</h3><button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4"><div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nome</label><input required type="text" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tipo</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setCatForm({...catForm, type: 'EXPENSE', color: '#ef4444'})} className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${catForm.type === 'EXPENSE' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>DESPESA</button><button type="button" onClick={() => setCatForm({...catForm, type: 'INCOME', color: '#10b981'})} className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${catForm.type === 'INCOME' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>RECEITA</button></div></div><button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Salvar Alterações</button></form>
          </div>
        </div>
      )}

      {modalType === 'account' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">{editingItem ? 'Editar Conta' : 'Nova Conta'}</h3><button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4"><div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nome do Banco / Carteira</label><input required type="text" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={accForm.name} onChange={e => setAccForm({...accForm, name: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Saldo Inicial</label><input required type="number" step="0.01" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={accForm.initialBalance} onChange={e => setAccForm({...accForm, initialBalance: e.target.value})} /></div><button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Salvar Alterações</button></form>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">Adicionar Usuário</h3><button onClick={() => { setShowAddUserModal(false); setNewName(''); setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewPassword2(''); setAddUserError(''); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            <form onSubmit={async (e) => { e.preventDefault(); await submitAddUser(); }} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nome Completo</label><input required type="text" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Username (opcional)</label><input type="text" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={newUsername} onChange={e => setNewUsername(e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">E-mail</label><input required type="email" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Senha (opcional)</label><input type="password" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
              <div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Repita a Senha</label><input type="password" className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} /></div>
              {addUserError && <div className="text-rose-600 text-sm">{addUserError}</div>}
              <div className="flex gap-2 mt-4"><button type="button" onClick={() => { setShowAddUserModal(false); setNewName(''); setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewPassword2(''); setAddUserError(''); }} className="px-3 py-2 border rounded">Cancelar</button><button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Criar Usuário</button></div>
            </form>
          </div>
        </div>
      )}

      {pwdModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">Alterar Senha - {pwdModalUser.name}</h3><button onClick={() => { setPwdModalUser(null); setPwdCurrent(''); setPwd1(''); setPwd2(''); setPwdError(''); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              {state.currentUser && (state.currentUser.id !== pwdModalUser.id) && !state.currentUser.isAdmin ? (<div className="text-sm text-rose-600">Você não tem permissão para alterar a senha deste usuário.</div>) : (
                <form onSubmit={async (e) => {
                  e.preventDefault(); setPwdError('');
                  if (!state.currentUser?.isAdmin) {
                    const { verifyPassword } = await import('../utils/auth');
                    const ok = await verifyPassword(pwdCurrent, pwdModalUser.passwordHash);
                    if (!ok) { setPwdError('Senha atual incorreta'); return; }
                  }
                  if (pwd1.length < 4) { setPwdError('Senha deve ter ao menos 4 caracteres'); return; }
                  if (pwd1 !== pwd2) { setPwdError('Senhas não coincidem'); return; }
                  const { hashPassword } = await import('../utils/auth'); const h = await hashPassword(pwd1);
                  onUpdate({ users: state.users.map(u => u.id === pwdModalUser.id ? { ...u, passwordHash: h } : u) }); setPwdModalUser(null); setPwdCurrent(''); setPwd1(''); setPwd2(''); setPwdError('');
                }}>
                  {!state.currentUser?.isAdmin && (<div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Senha Atual</label><input type="password" value={pwdCurrent} onChange={e => setPwdCurrent(e.target.value)} className="w-full px-4 py-2 border rounded" /></div>)}
                  <div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nova Senha</label><input type="password" value={pwd1} onChange={e => setPwd1(e.target.value)} className="w-full px-4 py-2 border rounded" /></div>
                  <div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Repita a Nova Senha</label><input type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} className="w-full px-4 py-2 border rounded" /></div>
                  {pwdError && <div className="text-rose-600 text-sm">{pwdError}</div>}
                  <div className="flex gap-2 mt-4"><button type="button" onClick={() => { setPwdModalUser(null); setPwdCurrent(''); setPwd1(''); setPwd2(''); setPwdError(''); }} className="px-3 py-2 border rounded">Cancelar</button><button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Salvar</button></div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
