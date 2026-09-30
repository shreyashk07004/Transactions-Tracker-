import { Transaction, Category, Settings, MonthKey } from '../types/models';
import { getDaysInMonth, subMonths, format } from 'date-fns';

export function getMonthTransactions(transactions: Transaction[], monthKey: MonthKey): Transaction[] {
  return transactions.filter(t => t.date.startsWith(monthKey));
}

export function getMonthTotals(transactions: Transaction[], monthKey: MonthKey): {
  expense: number;
  income: number;
  net: number;
  count: number;
} {
  const monthTx = getMonthTransactions(transactions, monthKey);
  let expense = 0;
  let income = 0;

  for (const t of monthTx) {
    if (t.type === 'expense') {
      expense += t.amount;
    } else if (t.type === 'income') {
      income += t.amount;
    }
  }

  return {
    expense,
    income,
    net: income - expense,
    count: monthTx.length
  };
}

export function getBudgetForMonth(
  monthlyBudgets: Record<MonthKey, number>,
  settings: Settings,
  monthKey: MonthKey
): number {
  if (monthlyBudgets && typeof monthlyBudgets[monthKey] === 'number') {
    return monthlyBudgets[monthKey];
  }
  return settings.defaultMonthlyBudget;
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  monthKey: MonthKey
): Array<{
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percent: number;
}> {
  const monthTx = getMonthTransactions(transactions, monthKey).filter(t => t.type === 'expense');
  const catMap = new Map<string, { categoryName: string; color: string; amount: number }>();

  // Map category info
  const categoryLookup = new Map<string, Category>();
  for (const c of categories) {
    categoryLookup.set(c.id, c);
  }

  let totalExpense = 0;
  for (const t of monthTx) {
    totalExpense += t.amount;
    const existing = catMap.get(t.categoryId);
    const cat = categoryLookup.get(t.categoryId);
    const name = cat ? cat.name : 'Unknown';
    const color = cat ? cat.color : '#8C867A';

    if (existing) {
      existing.amount += t.amount;
    } else {
      catMap.set(t.categoryId, {
        categoryName: name,
        color: color,
        amount: t.amount
      });
    }
  }

  const result: Array<{
    categoryId: string;
    categoryName: string;
    color: string;
    amount: number;
    percent: number;
  }> = [];

  for (const [id, data] of catMap.entries()) {
    const percent = totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0;
    result.push({
      categoryId: id,
      categoryName: data.categoryName,
      color: data.color,
      amount: data.amount,
      percent: percent
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export function getDailySeries(
  transactions: Transaction[],
  monthKey: MonthKey
): Array<{ day: number; dateStr: string; amount: number; isToday: boolean }> {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const targetDate = new Date(year, month - 1, 1);
  const daysCount = getDaysInMonth(targetDate);

  const dailyAmounts: number[] = new Array(daysCount + 1).fill(0);
  const monthTx = getMonthTransactions(transactions, monthKey).filter(t => t.type === 'expense');

  for (const t of monthTx) {
    const d = parseInt(t.date.split('-')[2], 10);
    if (d >= 1 && d <= daysCount) {
      dailyAmounts[d] += t.amount;
    }
  }

  const now = new Date();
  const currentMonthKey = format(now, 'yyyy-MM');
  const currentDay = now.getDate();

  const series = [];
  for (let d = 1; d <= daysCount; d++) {
    const dayPadded = d.toString().padStart(2, '0');
    series.push({
      day: d,
      dateStr: `${monthKey}-${dayPadded}`,
      amount: dailyAmounts[d],
      isToday: monthKey === currentMonthKey && d === currentDay
    });
  }

  return series;
}

export function getMonthlySeries(
  transactions: Transaction[],
  monthlyBudgets: Record<MonthKey, number>,
  settings: Settings,
  endMonth: MonthKey,
  count = 36
): Array<{
  monthKey: MonthKey;
  label: string;
  expense: number;
  income: number;
  budget: number;
  saved: number;
  savingsRate: number;
  count: number;
}> {
  const [yearStr, monthStr] = endMonth.split('-');
  const baseDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);

  const series = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = subMonths(baseDate, i);
    const mKey = format(d, 'yyyy-MM');
    const label = format(d, 'MMM yyyy');
    const totals = getMonthTotals(transactions, mKey);
    const budget = getBudgetForMonth(monthlyBudgets, settings, mKey);
    const saved = budget - totals.expense;
    const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0;

    series.push({
      monthKey: mKey,
      label,
      expense: totals.expense,
      income: totals.income,
      budget,
      saved,
      savingsRate,
      count: totals.count
    });
  }

  return series;
}

export function getSavings(budget: number, expense: number): {
  saved: number;
  overspent: number;
  percentUsed: number;
} {
  const remaining = budget - expense;
  const saved = remaining > 0 ? remaining : 0;
  const overspent = remaining < 0 ? Math.abs(remaining) : 0;
  const percentUsed = budget > 0 ? (expense / budget) * 100 : 0;

  return {
    saved,
    overspent,
    percentUsed
  };
}

export function getProjectedSpend(expense: number, dayOfMonth: number, daysInMonth: number): number {
  if (dayOfMonth <= 0) return 0;
  return (expense / dayOfMonth) * daysInMonth;
}

export function getSavingsRate(income: number, expense: number): number {
  if (income <= 0) return 0;
  return ((income - expense) / income) * 100;
}
