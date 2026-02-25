import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Tag, CreditCard, Users as UsersIcon, 
  Edit2, X, KeyRound, UserMinus, Lock, Unlock 
} from 'lucide-react';
import { AppState, Category, Account, User, TransactionType } from '../types'
import { hashPassword } from '../utils/auth';;

interface SettingsViewProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
  onlyUsers: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ state, onUpdate, onlyUsers }) => {

  const isAdmin = state.currentUser?.isAdmin === true;

  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'accounts' | 'users'>(
    isAdmin ? 'users' : 'categories'
  );
  
  const [modalType, setModalType] = useState<'category' | 'account' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // 🔹 FILTROS CORRETOS POR USUÁRIO LOGADO
  const myCategories = useMemo(() => {
    if (!state.currentUser || isAdmin) return [];
    return state.categories.filter(c => c.userId === state.currentUser!.id);
  }, [state.categories, state.currentUser, isAdmin]);

  const myAccounts = useMemo(() => {
    if (!state.currentUser || isAdmin) return [];
    return state.accounts.filter(a => a.userId === state.currentUser!.id);
  }, [state.accounts, state.currentUser, isAdmin]);

  const [catForm, setCatForm] = useState<{ name: string; type: TransactionType; color: string }>({
    name: '',
    type: 'EXPENSE',
    color: '#ef4444'
  });

  const [accForm, setAccForm] = useState<{ 
    name: string; 
    initialBalance: string; 
    type: 'CASH'|'BANK'|'CREDIT'; 
    dueDay?: string;
    startDate: string;
  }>({
    name: '',
    initialBalance: '0',
    type: 'BANK',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [addUserError, setAddUserError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // =========================
  // CATEGORIAS
  // =========================

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

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser) return;

    if (editingItem) {
      onUpdate({
        categories: state.categories.map(c =>
          c.id === editingItem.id ? { ...c, ...catForm } : c
        )
      });
    } else {
      onUpdate({
        categories: [
          ...state.categories,
          {
            id: Math.random().toString(36).substr(2, 9),
            userId: state.currentUser.id,
            name: catForm.name,
            type: catForm.type,
            color: catForm.color
          }
        ]
      });
    }

    setModalType(null);
  };

  const removeCategory = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;

    onUpdate({
      categories: state.categories.filter(c => c.id !== id)
    });

    alert('Categoria excluída com sucesso.');
  };

  // =========================
  // CONTAS
  // =========================

  const handleOpenAccModal = (item?: Account) => {
    if (item) {
      setEditingItem(item);
      setAccForm({
        name: item.name,
        initialBalance: item.initialBalance.toString(),
        type: item.type,
        dueDay: item.dueDay?.toString(),
        startDate: item.startDate
      });
    } else {
      setEditingItem(null);
      setAccForm({
        name: '',
        initialBalance: '0',
        type: 'BANK',
        startDate: new Date().toISOString().split('T')[0]
      });
    }
    setModalType('account');
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser) return;

    const numericBal = parseFloat(accForm.initialBalance);
    const due = accForm.dueDay ? parseInt(accForm.dueDay) : undefined;

    if (!accForm.startDate) {
      alert('Informe a data inicial da conta.');
      return;
    }

    if (editingItem) {

      onUpdate({
        accounts: state.accounts.map(a =>
          a.id === editingItem.id
            ? {
                ...a,
                name: accForm.name,
                initialBalance: numericBal,
                type: accForm.type,
                startDate: accForm.startDate,
                dueDay: accForm.type === 'CREDIT' ? due : undefined
              }
            : a
        )
      });

      alert('Conta atualizada com sucesso.');

    } else {

      const newAccount: Account = {
        id: Math.random().toString(36).substr(2, 9),
        userId: state.currentUser.id,
        name: accForm.name,
        type: accForm.type,
        initialBalance: numericBal,
        startDate: accForm.startDate,
        ...(accForm.type === 'CREDIT' && due ? { dueDay: due } : {})
      };

      onUpdate({
        accounts: [...state.accounts, newAccount]
      });

      alert('Conta criada com sucesso.');
    }

    setModalType(null);
  };

  const removeAccount = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;

    onUpdate({
      accounts: state.accounts.filter(a => a.id !== id)
    });

    alert('Conta excluída com sucesso.');
  };

  // =========================
  // VIEW
  // =========================

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* NAVEGAÇÃO */}
      <div className="flex border-b border-slate-200">
        {!isAdmin && (
          <>
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${
                activeSubTab === 'categories'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <Tag className="w-4 h-4" /> Categorias
            </button>

            <button
              onClick={() => setActiveSubTab('accounts')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 ${
                activeSubTab === 'accounts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Minhas Contas
            </button>
          </>
        )}

        {isAdmin && (
          <button className="flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 border-indigo-600 text-indigo-600">
            <UsersIcon className="w-4 h-4" /> Gestão de Usuários
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* ================= CATEGORIAS ================= */}
        {!isAdmin && activeSubTab === 'categories' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Minhas Categorias</h3>
              <button
                onClick={() => handleOpenCatModal()}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Nova Categoria
              </button>
            </div>

            {myCategories.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma categoria cadastrada.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myCategories.map(cat => (
                  <div key={cat.id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-semibold text-slate-700">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenCatModal(cat)}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => removeCategory(cat.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= CONTAS ================= */}
        {!isAdmin && activeSubTab === 'accounts' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Minhas Contas</h3>
              <button
                onClick={() => handleOpenAccModal()}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Nova Conta
              </button>
            </div>

            {myAccounts.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma conta cadastrada.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myAccounts.map(acc => (
                  <div key={acc.id} className="py-3 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">{acc.name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenAccModal(acc)}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => removeAccount(acc.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ADMIN ================= */}
        {isAdmin && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                Usuários do Sistema
              </h3>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setNewName('');
                  setNewUsername('');
                  setNewEmail('');
                  setNewPassword('');
                  setNewPassword2('');
                  setAddUserError('');
                  setShowAddUserModal(true);
                }}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Novo Usuário
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {state.users.map(user => (
                <div key={user.id} className="py-3 flex justify-between items-center">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>

                    <div className="flex items-center gap-3">

                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setNewName(user.name);
                          setNewUsername(user.username);
                          setNewEmail(user.email);
                          setNewPassword(user.password);
                          setNewPassword2(user.password);
                          setAddUserError('');
                          setShowAddUserModal(true);
                        }}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          const action = user.isBlocked ? 'desbloquear' : 'bloquear';

                          if (!window.confirm(`Deseja realmente ${action} este usuário?`)) return;

                          onUpdate({
                            users: state.users.map(u =>
                              u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u
                            )
                          });

                          alert(`Usuário ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'} com sucesso.`);
                        }}
                        className="text-slate-400 hover:text-amber-600"
                      >
                        {user.isBlocked ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={async () => {
                          const newPass = prompt('Digite a nova senha:');
                          if (!newPass) return;

                          if (newPass.length < 4) {
                            alert('Senha deve ter ao menos 4 caracteres.');
                            return;
                          }

                          if (!window.confirm('Confirma a alteração da senha?')) return;

                          const passwordHash = await hashPassword(newPass);

                          onUpdate({
                            users: state.users.map(u =>
                              u.id === user.id
                                ? {
                                    ...u,
                                    passwordHash,
                                    mustChangePassword: false
                                  }
                                : u
                            )
                          });

                          alert('Senha alterada com sucesso.');
                        }}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (user.isAdmin) {
                            alert('O usuário Administrador não pode ser excluído.');
                            return;
                          }

                          if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

                          onUpdate({
                            users: state.users.filter(u => u.id !== user.id)
                          });

                          alert('Usuário excluído com sucesso.');
                        }}
                        className={`text-slate-400 ${
                          user.isAdmin 
                            ? 'opacity-40 cursor-not-allowed' 
                            : 'hover:text-rose-600'
                        }`}
                        disabled={user.isAdmin}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
            {/* ================= MODAL CATEGORIA ================= */}
      {modalType === 'category' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Tipo
                </label>
                <select
                  value={catForm.type}
                  onChange={e => setCatForm({ ...catForm, type: e.target.value as TransactionType })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Cor
                </label>
                <input
                  type="color"
                  value={catForm.color}
                  onChange={e => setCatForm({ ...catForm, color: e.target.value })}
                  className="w-full mt-1 h-10 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CONTA ================= */}
      {modalType === 'account' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem ? 'Editar Conta' : 'Nova Conta'}
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={accForm.name}
                  onChange={e => setAccForm({ ...accForm, name: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Saldo Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={accForm.initialBalance}
                  onChange={e => setAccForm({ ...accForm, initialBalance: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Data Inicial
                </label>
                <input
                  type="date"
                  required
                  value={accForm.startDate}
                  onChange={e => setAccForm({ ...accForm, startDate: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Tipo de Conta
                </label>
                <select
                  value={accForm.type}
                  onChange={e => setAccForm({ ...accForm, type: e.target.value as any })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="BANK">Banco</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CREDIT">Cartão de Crédito</option>
                </select>
              </div>

              {accForm.type === 'CREDIT' && (
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Dia de Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={accForm.dueDay || ''}
                    onChange={e => setAccForm({ ...accForm, dueDay: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL USUÁRIO ================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setShowAddUserModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAddUserError('');

                if (!newName || !newEmail) {
                  setAddUserError('Preencha nome e email.');
                  return;
                }

                if (newPassword || newPassword2) {
                  if (newPassword !== newPassword2) {
                    setAddUserError('As senhas não coincidem.');
                    return;
                  }

                  if (newPassword.length < 4) {
                    setAddUserError('Senha deve ter ao menos 4 caracteres.');
                    return;
                  }
                }

                let passwordHash: string | undefined = undefined;

                if (newPassword) {
                  passwordHash = await hashPassword(newPassword);
                }

                if (editingUser) {

                  if (!window.confirm('Confirmar alteração do usuário?')) return;

                  onUpdate({
                    users: state.users.map(u =>
                      u.id === editingUser.id
                        ? {
                            ...u,
                            name: newName,
                            username: newUsername,
                            email: newEmail,
                            ...(passwordHash
                              ? {
                                  passwordHash,
                                  mustChangePassword: true
                                }
                              : {})
                          }
                        : u
                    )
                  });

                  alert('Usuário atualizado com sucesso.');

                } else {

                  const newUser: User = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: newName,
                    username: newUsername,
                    email: newEmail,
                    isAdmin: false,
                    isBlocked: false,
                    passwordHash,
                    mustChangePassword: !!passwordHash
                  };

                  onUpdate({
                    users: [...state.users, newUser]
                  });

                  alert('Usuário criado com sucesso.');
                }

                setShowAddUserModal(false);
              }}
              className="space-y-4"
            >

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Nome
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={newPassword2}
                  onChange={e => setNewPassword2(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              {addUserError && (
                <p className="text-sm text-rose-600 font-semibold">
                  {addUserError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all duration-200"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl"
                >
                  Salvar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;