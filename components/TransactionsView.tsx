import React, { useState, useMemo } from "react";
import { Calendar, Plus, Edit2, Trash2, X } from "lucide-react";
import { AppState, Transaction, Category, Account, TransactionType } from "../types";

interface TransactionsViewProps {
  state: AppState;
  categories: Category[];
  accounts: Account[];
  addTransaction: (t: Omit<Transaction, "id" | "userId">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

export default function TransactionsView({
  state,
  categories,
  accounts,
  addTransaction,
  updateTransaction,
  deleteTransaction,
}: TransactionsViewProps) {

  // ✅ Mês padrão 1–12
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const initialFormState = {
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    accountId: "",
    type: "EXPENSE" as TransactionType,
    isRecurring: false,
    notes: "",
  };

  const [transactionForm, setTransactionForm] = useState(initialFormState);

  const monthsLabels = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  // ✅ SEM new Date() (evita bug de timezone)
  const yearsOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const yearsFromTransactions = state.transactions.map(t => {
      const [year] = t.date.split("-");
      return Number(year);
    });

    const minYear =
      yearsFromTransactions.length > 0
        ? Math.min(...yearsFromTransactions)
        : currentYear;

    const startYear = Math.min(currentYear, minYear);

    const years: number[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push(y);
    }

    return years;
  }, [state.transactions]);

  const filteredTransactions = useMemo(() => {
    if (!state.currentUser) return [];

    return state.transactions.filter((t) => {
      const [year, month] = t.date.split("-").map(Number);

      return (
        t.userId === state.currentUser.id &&
        month === selectedMonth &&
        year === selectedYear &&
        t.description.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [state.transactions, state.currentUser, selectedMonth, selectedYear, search]);

  const formatDateBR = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setTransactionForm(initialFormState);
    setIsTransactionModalOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);

    setTransactionForm({
      description: transaction.description,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      type: transaction.type,
      isRecurring: transaction.isRecurring,
      notes: transaction.notes || "",
    });

    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionForm.description || !transactionForm.amount) return;
    if (!transactionForm.categoryId || !transactionForm.accountId) return;

    const payload = {
      ...transactionForm,
      amount: Number(transactionForm.amount),
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }

    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Movimentações</h1>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20 text-sm"
        >
          <Plus size={18} />
          Nova Movimentação
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {monthsLabels.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {yearsOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição..."
            className="w-full bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {filteredTransactions.map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-center px-4 py-3 border-b last:border-b-0"
          >
            <div>
              <div className="font-medium">{t.description}</div>
              <div className="text-sm text-gray-500">
                {formatDateBR(t.date)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`font-semibold ${t.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                R$ {t.amount.toFixed(2)}
              </span>

              <button onClick={() => openEditModal(t)}>
                <Edit2 size={16} />
              </button>

              <button onClick={() => deleteTransaction(t.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden">

            <button
              onClick={() => {
                setIsTransactionModalOpen(false);
                setEditingTransaction(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTransaction ? "Editar Movimentação" : "Nova Movimentação"}
              </h2>
            </div>

            <div className="p-8 space-y-6">

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTransactionForm({...transactionForm, type: "EXPENSE"})}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm ${
                    transactionForm.type === "EXPENSE"
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-100 bg-white text-slate-400"
                  }`}
                >
                  DESPESA
                </button>

                <button
                  type="button"
                  onClick={() => setTransactionForm({...transactionForm, type: "INCOME"})}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm ${
                    transactionForm.type === "INCOME"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-100 bg-white text-slate-400"
                  }`}
                >
                  RECEITA
                </button>
              </div>

              <input
                type="text"
                placeholder="Descrição"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm({...transactionForm, description: e.target.value})
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
              />

              <input
                type="number"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({...transactionForm, amount: Number(e.target.value)})
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
              />

              <input
                type="date"
                value={transactionForm.date}
                onChange={(e) =>
                  setTransactionForm({...transactionForm, date: e.target.value})
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
              />

              <select
                value={transactionForm.categoryId}
                onChange={(e) =>
                  setTransactionForm({...transactionForm, categoryId: e.target.value})
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
              >
                <option value="">Selecione</option>
                {categories
                  .filter((c) => c.type === transactionForm.type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>

              <select
                value={transactionForm.accountId}
                onChange={(e) =>
                  setTransactionForm({...transactionForm, accountId: e.target.value})
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
              >
                <option value="">Selecione</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              <textarea
                rows={3}
                value={transactionForm.notes}
                onChange={(e) =>
                  setTransactionForm({...transactionForm, notes: e.target.value})
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                placeholder="Observações (opcional)"
              />

              <button
                onClick={handleSaveTransaction}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl"
              >
                {editingTransaction ? "Confirmar Edição" : "Salvar Movimentação"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}