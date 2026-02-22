import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Tag, CreditCard, Users as UsersIcon, 
  Edit2, X, KeyRound, UserMinus, Lock, Unlock 
} from 'lucide-react';
import { AppState, Category, Account, User, TransactionType } from '../types';

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

  const [accForm, setAccForm] = useState<{ name: string; initialBalance: string; type: 'CASH'|'BANK'|'CREDIT'; dueDay?: string }>({
    name: '',
    initialBalance: '0',
    type: 'BANK'
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
    if (window.confirm('Excluir esta categoria?')) {
      onUpdate({
        categories: state.categories.filter(c => c.id !== id)
      });
    }
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
        dueDay: item.dueDay?.toString()
      });
    } else {
      setEditingItem(null);
      setAccForm({ name: '', initialBalance: '0', type: 'BANK' });
    }
    setModalType('account');
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser) return;

    const numericBal = parseFloat(accForm.initialBalance);
    const due = accForm.dueDay ? parseInt(accForm.dueDay) : undefined;

    if (editingItem) {
      onUpdate({
        accounts: state.accounts.map(a =>
          a.id === editingItem.id
            ? {
                ...a,
                name: accForm.name,
                initialBalance: numericBal,
                type: accForm.type,
                dueDay: accForm.type === 'CREDIT' ? due : undefined
              }
            : a
        )
      });
    } else {
      onUpdate({
        accounts: [
          ...state.accounts,
          {
            id: Math.random().toString(36).substr(2, 9),
            userId: state.currentUser.id,
            name: accForm.name,
            type: accForm.type,
            initialBalance: numericBal,
            ...(accForm.type === 'CREDIT' && due ? { dueDay: due } : {})
          }
        ]
      });
    }

    setModalType(null);
  };

  const removeAccount = (id: string) => {
    if (window.confirm('Excluir esta conta?')) {
      onUpdate({
        accounts: state.accounts.filter(a => a.id !== id)
      });
    }
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
                    <button onClick={() => removeCategory(cat.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                    <button onClick={() => removeAccount(acc.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ADMIN ================= */}
        {isAdmin && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800">Usuários do Sistema</h3>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;