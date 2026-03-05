import { Transaction, Account } from "../types";

interface ExpandedTransaction extends Transaction {
  effectiveMonth: number;
  effectiveYear: number;
  installmentIndex?: number;
}

interface EngineInput {
  transactions: Transaction[];
  accounts: Account[];
}

export function expandTransactions({
  transactions,
  accounts,
}: EngineInput): ExpandedTransaction[] {

  const expanded: ExpandedTransaction[] = [];

  transactions.forEach((t) => {
    const account = accounts.find(a => a.id === t.accountId);

    // Se não for cartão → impacto imediato
    if (!account || account.type !== "CREDIT") {
      const [year, month] = t.date.split("-").map(Number);

      expanded.push({
        ...t,
        effectiveMonth: month,
        effectiveYear: year,
      });

      return;
    }

    // 🔵 Cartão de crédito
    const installments = t.installments || 1;
    const dueDay = account.dueDay || 1;

    const [year, month, day] = t.date.split("-").map(Number);

    // Regra dos 5 dias
    const cutoffDay = dueDay - 5;

    let firstMonth = month;
    let firstYear = year;

    if (day > cutoffDay) {
      firstMonth += 1;
      if (firstMonth > 12) {
        firstMonth = 1;
        firstYear += 1;
      }
    }

    const installmentValue = t.amount / installments;

    for (let i = 0; i < installments; i++) {
      let effMonth = firstMonth + i;
      let effYear = firstYear;

      while (effMonth > 12) {
        effMonth -= 12;
        effYear += 1;
      }

      expanded.push({
        ...t,
        amount: installmentValue,
        effectiveMonth: effMonth,
        effectiveYear: effYear,
        installmentIndex: i + 1,
      });
    }
  });

  return expanded;
}