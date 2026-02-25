import React, { useState, useMemo } from "react";
import { Calendar, Plus, Edit2, Trash2 } from "lucide-react";
import { AppState, Transaction, Category, Account, TransactionType } from "../types";

interface TransactionsViewProps {
  state: AppState;
  categories: Category[];
  accounts: Account[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [transactionForm, setTransactionForm] = useState({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    accountId: "",
    type: "expense" as TransactionType,
    isRecurring: false,
  });

  const monthsLabels = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const yearsOptions = useMemo(() => {
  const currentYear = new Date().getFullYear();

  const yearsFromTransactions = state.transactions.map(t =>
    new Date(t.date).getFullYear()
  );

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
    return state.transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() + 1 === selectedMonth &&
        date.getFullYear() === selectedYear &&
        t.description.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [state.transactions, selectedMonth, selectedYear, search]);

  const openNewModal = () => {
    setEditingTransaction(null);
    setTransactionForm({
      type: "expense",
      description: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
      accountId: "",
      notes: "",
    });
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
    });

    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionForm.description || !transactionForm.amount) return;

    const transaction: Transaction = {
      id: editingTransaction?.id || crypto.randomUUID(),
      userId: editingTransaction?.userId || state.currentUser!.id,
      isRecurring: editingTransaction?.isRecurring ?? false,
      ...transactionForm,
    };

    if (editingTransaction) {
      updateTransaction(transaction);
    } else {
      addTransaction(transaction);
    }

    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Movimentações</h1>

        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl transition"
        >
          <Plus size={18} />
          Nova Movimentação
        </button>
      </div>

      {/* FILTROS — PADRÃO EXATO DO DASHBOARD */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">

        {/* Mês + Ano */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {monthsLabels.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            {yearsOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Busca */}
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição..."
            className="w-full bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </div>


      {/* Lista */}
      <div className="bg-white bg-slate-50 rounded-2xl shadow overflow-hidden">
        {filteredTransactions.map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-center px-4 py-3 border-b last:border-b-0"
          >
            <div>
              <div className="font-medium">{t.description}</div>
              <div className="text-sm text-gray-500">
                {new Date(t.date).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`font-semibold ${
                  t.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
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

      {/* MODAL */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white bg-slate-50 rounded-2xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-xl font-semibold mb-4">
              {editingTransaction ? "Editar Movimentação" : "Nova Movimentação"}
            </h2>

            <div className="space-y-4">

              <select
                value={transactionForm.type}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    type: e.target.value as TransactionType,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>

              <input
                type="text"
                placeholder="Descrição"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    description: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              />

              <input
                type="number"
                placeholder="Valor"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    amount: Number(e.target.value),
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              />

              <input
                type="date"
                value={transactionForm.date}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    date: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              />

              <select
                value={transactionForm.categoryId}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    categoryId: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">Categoria</option>
                {categories
                  .filter((c) => c.type === transactionForm.type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>

              <select
                value={transactionForm.accountId}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    accountId: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              >
                <option value="">Conta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Observação"
                value={transactionForm.notes}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    notes: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
                rows={3}
              />

            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveTransaction}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Salvar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}