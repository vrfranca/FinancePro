import React, { useState, useMemo } from "react";
import { Calendar, Plus, Edit2, Trash2, X } from "lucide-react";
import { AppState, Transaction, Category, Account, TransactionType, RecurringItem } from "../types";
import { expandTransactions, expandRecurringItems } from "../utils/financialEngine";

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
  const [editingRecurringForMonth, setEditingRecurringForMonth] = useState<RecurringItem | null>(null);

  const initialFormState = {
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    accountId: "",
    sourceAccountId: "",
    destinationAccountId: "",
    type: "EXPENSE" as TransactionType,
    isRecurring: false,
    installments: 1, // NOVO
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

    // Expandir transações parceladas
    const userTransactions = state.transactions.filter(t => t.userId === state.currentUser.id);
    const expandedTransactions = expandTransactions({
      transactions: userTransactions,
      accounts: accounts
    });

    // Expandir recorrentes
    const userRecurring = state.recurringItems.filter(r => r.userId === state.currentUser.id);
    const expandedRecurring = expandRecurringItems(userRecurring, selectedMonth, selectedYear);

    // Verificar se há transações manuais que sobrescrevem recorrentes em um mês específico
    const recurringOverrides = new Set<string>();
    userTransactions.forEach(t => {
      // Se uma transação foi criada a partir de um recorrente em um mês específico, marcar como override
      if ((t as any)._recurringOverride) {
        recurringOverrides.add((t as any)._recurringOverrideId);
      }
    });

    // Combinar e filtrar
    const allItems = [
      ...expandedTransactions.map((t) => ({
        ...t,
        _type: 'transaction',
        displayDescription: t.installments && t.installments > 1 
          ? `${t.description} (Parcela ${t.installmentIndex}/${t.installments})`
          : t.description,
        _originalTransaction: state.transactions.find(orig => orig.id === t.id)
      })),
      ...expandedRecurring
        .filter(r => {
          // Verificar se não foi sobrescrito por uma transação manual
          const override = userTransactions.find(t => 
            (t as any)._recurringOverride && 
            (t as any)._recurringOverrideId === r.id &&
            t.date.split('-').slice(0, 2).join('-') === `${r.effectiveYear.toString().padStart(4, '0')}-${r.effectiveMonth.toString().padStart(2, '0')}`
          );
          return !override;
        })
        .map((r) => ({
          ...r,
          _type: 'recurring',
          date: `${r.effectiveYear.toString().padStart(4, '0')}-${r.effectiveMonth.toString().padStart(2, '0')}-${r.dayOfMonth.toString().padStart(2, '0')}`,
          displayDescription: r.occurrences && r.occurrences > 1 
            ? `${r.description} (Ocorrência ${r.occurrenceIndex}/${r.occurrences})`
            : r.description,
          _originalRecurring: state.recurringItems.find(orig => orig.id === r.id)
        }))
    ].filter((item) => {
      return (
        item.effectiveMonth === selectedMonth &&
        item.effectiveYear === selectedYear &&
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    });

    // Ordenar por dia do mês
    return allItems.sort((a, b) => {
      const dayA = parseInt(a.date.split('-')[2]);
      const dayB = parseInt(b.date.split('-')[2]);
      return dayA - dayB;
    });
  }, [state.transactions, state.recurringItems, state.currentUser, accounts, selectedMonth, selectedYear, search]);

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
      categoryId: transaction.categoryId || "",
      accountId: transaction.accountId || "",
      sourceAccountId: transaction.sourceAccountId || "",
      destinationAccountId: transaction.destinationAccountId || "",
      type: transaction.type,
      isRecurring: transaction.isRecurring,
      installments: transaction.installments || 1, // NOVO
      notes: transaction.notes || "",
    });

    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionForm.description.trim()) return;
    if (transactionForm.amount <= 0) return;

    if (transactionForm.type === 'TRANSFER') {
      if (!transactionForm.sourceAccountId || !transactionForm.destinationAccountId) return;
      if (transactionForm.sourceAccountId === transactionForm.destinationAccountId) return;
    } else {
      if (!transactionForm.categoryId || !transactionForm.accountId) return;
    }

    const payload = {
      ...transactionForm,
      amount: Number(transactionForm.amount),
      accountId: transactionForm.type === 'TRANSFER' ? transactionForm.sourceAccountId : transactionForm.accountId,
    };

    if (editingRecurringForMonth) {
      // Edição de recorrente para um mês específico: criar transação que sobrescreve
      addTransaction({
        ...payload,
        isRecurring: false,
        installments: 1,
        _recurringOverride: true,
        _recurringOverrideId: editingRecurringForMonth.id
      } as any);
      setIsTransactionModalOpen(false);
      setEditingRecurringForMonth(null);
    } else if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
      setIsTransactionModalOpen(false);
      setEditingTransaction(null);
    } else {
      addTransaction(payload);
      setIsTransactionModalOpen(false);
      setEditingTransaction(null);
    }

    setTransactionForm(initialFormState);
  };

  const selectedAccount = accounts.find(a => a.id === (transactionForm.type === 'TRANSFER' ? transactionForm.sourceAccountId : transactionForm.accountId));
  const isCreditAccount = selectedAccount?.type === "CREDIT";

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
            key={`${t._type}-${t.id}-${t.installmentIndex || t.occurrenceIndex || 1}`}
            className="flex justify-between items-center px-4 py-3 border-b last:border-b-0"
          >
            <div>
              <div className="font-medium">{t.displayDescription}</div>
              <div className="text-sm text-gray-500">
                {formatDateBR(t.date)}
                {t._type === 'recurring' && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Recorrente</span>}
              </div>
              {t.type === 'TRANSFER' && t.sourceAccountId && t.destinationAccountId && (
                <div className="text-xs text-slate-400">
                  {accounts.find(a => a.id === t.sourceAccountId)?.name} → {accounts.find(a => a.id === t.destinationAccountId)?.name}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className={`font-semibold ${t.type === "INCOME" ? "text-emerald-600" : t.type === "EXPENSE" ? "text-rose-600" : "text-slate-600"}`}>
                R$ {t.amount.toFixed(2)}
              </span>

              <button onClick={() => {
                if (t._type === 'recurring') {
                  setEditingRecurringForMonth(t._originalRecurring || t);
                  setTransactionForm({
                    description: t.description,
                    amount: t.amount,
                    date: t.date,
                    categoryId: t.categoryId || "",
                    accountId: t.accountId || "",
                    sourceAccountId: t.sourceAccountId || "",
                    destinationAccountId: t.destinationAccountId || "",
                    type: t.type,
                    isRecurring: false,
                    installments: 1,
                    notes: "",
                  });
                } else {
                  openEditModal(t._originalTransaction || t);
                }
              }}>
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
                setEditingRecurringForMonth(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRecurringForMonth ? `Editar Movimentação Recorrente - ${monthsLabels[selectedMonth - 1]} de ${selectedYear}` : editingTransaction ? "Editar Movimentação" : "Nova Movimentação"}
              </h2>
              {editingRecurringForMonth && (
                <p className="text-sm text-slate-600 mt-2">
                  Esta edição afetará apenas o mês de {monthsLabels[selectedMonth - 1]}, não o registro recorrente original.
                </p>
              )}
            </div>

            <div className="p-8 space-y-6">

              <input
                type="text"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    description: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                placeholder="Descrição"
              />

              <div className="grid grid-cols-3 gap-4">
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

                <button
                  type="button"
                  onClick={() => setTransactionForm({...transactionForm, type: "TRANSFER"})}
                  className={`py-3 rounded-2xl border-2 font-bold text-sm ${
                    transactionForm.type === "TRANSFER"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-100 bg-white text-slate-400"
                  }`}
                >
                  TRANSFERÊNCIA
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionForm.amount}
                    onChange={(e) =>
                      setTransactionForm({...transactionForm, amount: Number(e.target.value)})
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={transactionForm.date}
                    onChange={(e) =>
                      setTransactionForm({...transactionForm, date: e.target.value})
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                  />
                </div>

                {isCreditAccount && !editingRecurringForMonth && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                      Parcelas
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={transactionForm.installments}
                      onChange={(e) =>
                        setTransactionForm({
                          ...transactionForm,
                          installments: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-2xl"
                      placeholder="1"
                    />
                  </div>
                )}

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transactionForm.type !== 'TRANSFER' ? (
                  <>
                    <select
                      value={transactionForm.categoryId}
                      onChange={(e) =>
                        setTransactionForm({...transactionForm, categoryId: e.target.value})
                      }
                      className="px-4 py-3 border border-slate-300 rounded-2xl"
                    >
                      <option value="">Selecione Categoria</option>
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
                      className="px-4 py-3 border border-slate-300 rounded-2xl"
                    >
                      <option value="">Selecione Conta</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      value={transactionForm.sourceAccountId}
                      onChange={(e) =>
                        setTransactionForm({...transactionForm, sourceAccountId: e.target.value})
                      }
                      className="px-4 py-3 border border-slate-300 rounded-2xl"
                    >
                      <option value="">Conta de Origem</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>

                    <select
                      value={transactionForm.destinationAccountId}
                      onChange={(e) =>
                        setTransactionForm({...transactionForm, destinationAccountId: e.target.value})
                      }
                      className="px-4 py-3 border border-slate-300 rounded-2xl"
                    >
                      <option value="">Conta de Destino</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>

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
                {editingRecurringForMonth ? "Salvar para este Mês" : editingTransaction ? "Confirmar Edição" : "Salvar Movimentação"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}