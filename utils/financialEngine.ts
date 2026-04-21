import { Transaction, Account, RecurringItem } from "../types";

interface ExpandedTransaction extends Transaction {
  effectiveMonth: number;
  effectiveYear: number;
  installmentIndex?: number;
}

interface ExpandedRecurring extends RecurringItem {
  effectiveMonth: number;
  effectiveYear: number;
  occurrenceIndex?: number;
  _isExpandedRecurring: true;
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

    const installmentValue = t.amount;

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

export function expandRecurringItems(
  recurringItems: RecurringItem[],
  selectedMonth: number,
  selectedYear: number,
  monthsToExpand: number = 12
): ExpandedRecurring[] {
  const expanded: ExpandedRecurring[] = [];

  recurringItems.forEach((r) => {
    const startDate = r.startDate ? new Date(r.startDate) : new Date();
    const occurrences = r.occurrences ?? 1;

    // Calcular quantos meses já passaram desde startDate até selectedMonth/selectedYear
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();

    for (let i = 0; i < occurrences; i++) {
      let effMonth = startMonth + i;
      let effYear = startYear;

      while (effMonth > 12) {
        effMonth -= 12;
        effYear += 1;
      }

      // Apenas incluir se estiver dentro da janela de expansão
      // (mês selecionado até monthsToExpand meses para trás)
      const isInWindow = 
        (effYear === selectedYear && effMonth === selectedMonth) ||
        (effYear === selectedYear && effMonth < selectedMonth) ||
        (effYear < selectedYear);

      if (isInWindow) {
        expanded.push({
          ...r,
          effectiveMonth: effMonth,
          effectiveYear: effYear,
          occurrenceIndex: i + 1,
          _isExpandedRecurring: true,
        });
      }
    }
  });

  return expanded;
}