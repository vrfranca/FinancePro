import React, { useState, useMemo } from "react";
import { CreditInvoice, Account, Category, Transaction } from "../types";
import { CreditCard, Calendar, Edit2, Trash2, X } from "lucide-react";

interface Props {
  invoices: CreditInvoice[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  onPayInvoice: (invoiceId: string, paymentAccountId: string, paymentAmount?: number, paymentDate?: string) => void;
  onUpdateInvoiceItem: (invoiceId: string, itemId: string, updates: { description: string; amount: number }) => void;
  onDeleteInvoiceItem: (invoiceId: string, itemId: string) => void;
}

const CreditCardView: React.FC<Props> = ({
  invoices,
  accounts,
  categories,
  transactions,
  onPayInvoice,
  onUpdateInvoiceItem,
  onDeleteInvoiceItem
}) => {

  const creditAccounts = accounts.filter(a => a.type === "CREDIT");
  const paymentAccounts = accounts.filter(a => a.type !== "CREDIT");

  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Estado para o modal de edição
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: ''
  });

  // Estado para modal de pagamento
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: '',
    paymentAccountId: ''
  });

  // Funções para gerenciar edição
  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setEditForm({
      description: item.description,
      amount: item.amount.toString()
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem || !invoice) return;

    const numericAmount = parseFloat(editForm.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Valor deve ser um número positivo.');
      return;
    }

    onUpdateInvoiceItem(invoice.id, editingItem.id, {
      description: editForm.description,
      amount: numericAmount
    });

    setEditingItem(null);
  };

  const handleDeleteItem = (item: any) => {
    if (!invoice) return;

    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;

    onDeleteInvoiceItem(invoice.id, item.id);
  };

  const handleOpenPaymentModal = () => {
    if (!invoice) return;

    const defaultPaymentDate = `${invoice.year}-${String(invoice.month).padStart(2,'0')}-01`;

    setPaymentForm({
      amount: invoice.total.toString(),
      date: defaultPaymentDate,
      paymentAccountId: ''
    });

    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!invoice) return;
    if (!paymentForm.paymentAccountId) {
      alert('Selecione uma conta de origem para o pagamento.');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Valor deve ser um número positivo.');
      return;
    }

    onPayInvoice(invoice.id, paymentForm.paymentAccountId, amount, paymentForm.date);
    setIsPaymentModalOpen(false);
  };

  const monthsLabels = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  const yearsOptions = useMemo(() => {

    const years = new Set<number>();

    invoices.forEach(i => years.add(i.year));

    years.add(new Date().getFullYear());

    return Array.from(years).sort((a,b)=>a-b);

  }, [invoices]);

  const invoice = useMemo(() => {

    return invoices.find(i =>
      i.accountId === selectedAccount &&
      i.month === month &&
      i.year === year
    );

  }, [invoices, selectedAccount, month, year]);

  return (

    <div className="p-6 space-y-6">

      <h1 className="text-xl font-bold">Fatura do Cartão</h1>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">

        {/* CARTÃO */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">

          <CreditCard className="w-4 h-4 text-slate-400" />

          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="">Selecione o cartão</option>

            {creditAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}

          </select>

        </div>

        {/* MÊS / ANO */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">

          <Calendar className="w-4 h-4 text-slate-400" />

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >

            {monthsLabels.map((m, i) => (
              <option key={i+1} value={i+1}>
                {m}
              </option>
            ))}

          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >

            {yearsOptions.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}

          </select>

        </div>

      </div>

      {/* Quando NÃO existe fatura */}
      
      {!invoice && selectedAccount && (
        <div className="bg-white p-6 rounded-xl shadow text-center text-slate-500">
            Nenhuma fatura encontrada para este período.
        </div>
      )}   
      
      {/* Quando EXISTE fatura */}

      {invoice && (

        <div className="bg-white rounded-xl shadow p-4">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b">
                <th className="text-left py-2">Descrição</th>
                <th className="text-right py-2">Valor</th>
                <th className="text-center py-2 w-24">Ações</th>
              </tr>

            </thead>

            <tbody>

              {invoice.items.map(item => (

                <tr key={item.id} className="border-b hover:bg-slate-50">

                  <td className="py-2">
                    {item.description}
                  </td>

                  <td className="text-right">
                    {item.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                        })}
                  </td>

                  <td className="text-center py-2">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-slate-400 hover:text-indigo-600 p-1"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          <div className="text-right font-bold mt-4">
            Total: {invoice.total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
                })}
          </div>

          {!invoice.isPaid && (

            <button
              onClick={handleOpenPaymentModal}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Pagar Fatura
            </button>

          )}

          {invoice.isPaid && (

            <div className="mt-4 text-green-600 font-semibold">
              Fatura paga
            </div>

          )}

        </div>

      )}

      {/* Modal de Edição */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                Editar Lançamento
              </h3>
              <button onClick={() => setEditingItem(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editForm.amount}
                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      {isPaymentModalOpen && invoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                Pagar Fatura
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">Total da Fatura</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {invoice.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                })}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmPayment(); }} className="space-y-4">

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Valor Pago
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Data de Pagamento
                </label>
                <input
                  type="date"
                  required
                  value={paymentForm.date}
                  onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Conta de Origem
                </label>
                <select
                  required
                  value={paymentForm.paymentAccountId}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentAccountId: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">Selecione uma conta</option>
                  {paymentAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

  );
};

export default CreditCardView;