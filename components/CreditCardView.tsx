import React, { useState, useMemo } from "react";
import { CreditInvoice, Account, Category } from "../types";
import { CreditCard, Calendar, Wallet } from "lucide-react";

interface Props {
  invoices: CreditInvoice[];
  accounts: Account[];
  categories: Category[];
  onPayInvoice: (invoiceId: string, paymentAccountId: string) => void;
}

const CreditCardView: React.FC<Props> = ({
  invoices,
  accounts,
  categories,
  onPayInvoice
}) => {

  const creditAccounts = accounts.filter(a => a.type === "CREDIT");
  const paymentAccounts = accounts.filter(a => a.type !== "CREDIT");

  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [paymentAccount, setPaymentAccount] = useState<string>("");

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

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

        {/* CONTA PAGAMENTO */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">

          <Wallet className="w-4 h-4 text-slate-400" />

          <select
            value={paymentAccount}
            onChange={(e) => setPaymentAccount(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >

            <option value="">Conta de pagamento</option>

            {paymentAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
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
              </tr>

            </thead>

            <tbody>

              {invoice.items.map(item => (

                <tr key={item.id} className="border-b">

                  <td className="py-2">
                    {item.description}
                  </td>

                  <td className="text-right">
                    {item.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                        })}
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
              onClick={() => {

                if (!paymentAccount) return;

                onPayInvoice(invoice.id, paymentAccount);

              }}
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

    </div>

  );
};

export default CreditCardView;