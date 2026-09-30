import { describe, it, expect } from 'vitest';
import {
  getMonthTransactions,
  getMonthTotals,
  getBudgetForMonth,
  getCategoryBreakdown,
  getDailySeries,
  getMonthlySeries,
  getSavings,
  getProjectedSpend,
  getSavingsRate
} from '../src/renderer/src/lib/calc';
import { Transaction, Category, Settings } from '../src/renderer/src/types/models';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Food', color: '#4F46E5', discretionary: false, archived: false },
  { id: 'cat-2', name: 'Dining Out', color: '#1A9E5F', discretionary: true, archived: false }
];

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'expense',
    amount: 1200,
    date: '2026-09-02',
    categoryId: 'cat-1',
    description: 'Groceries',
    paymentMethod: 'upi',
    note: '',
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 800,
    date: '2026-09-15',
    categoryId: 'cat-2',
    description: 'Dinner',
    paymentMethod: 'credit',
    note: '',
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'tx-3',
    type: 'income',
    amount: 50000,
    date: '2026-09-01',
    categoryId: 'cat-1',
    description: 'Salary',
    paymentMethod: 'netbanking',
    note: '',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z'
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 500,
    date: '2026-08-10',
    categoryId: 'cat-1',
    description: 'Past item',
    paymentMethod: 'cash',
    note: '',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z'
  }
];

const mockSettings: Settings = {
  currencySymbol: '₹',
  locale: 'en-IN',
  defaultMonthlyBudget: 25000,
  savingsGoalPercent: 20,
  firstRunCompleted: true
};

describe('Calculations (calc.ts)', () => {
  it('getMonthTransactions filters transactions by monthKey', () => {
    const res = getMonthTransactions(mockTransactions, '2026-09');
    expect(res.length).toBe(3);
    expect(res.map(r => r.id)).toEqual(['tx-1', 'tx-2', 'tx-3']);
  });

  it('getMonthTotals calculates expense, income, net and count correctly', () => {
    const totals = getMonthTotals(mockTransactions, '2026-09');
    expect(totals.expense).toBe(2000);
    expect(totals.income).toBe(50000);
    expect(totals.net).toBe(48000);
    expect(totals.count).toBe(3);
  });

  it('getBudgetForMonth handles overrides and defaults', () => {
    const overrides = { '2026-09': 35000 };
    expect(getBudgetForMonth(overrides, mockSettings, '2026-09')).toBe(35000);
    expect(getBudgetForMonth(overrides, mockSettings, '2026-08')).toBe(25000);
  });

  it('getCategoryBreakdown calculates amounts and percentages sorted descending', () => {
    const breakdown = getCategoryBreakdown(mockTransactions, mockCategories, '2026-09');
    expect(breakdown.length).toBe(2);
    expect(breakdown[0].categoryId).toBe('cat-1');
    expect(breakdown[0].amount).toBe(1200);
    expect(breakdown[0].percent).toBe(60);
    expect(breakdown[1].categoryId).toBe('cat-2');
    expect(breakdown[1].amount).toBe(800);
    expect(breakdown[1].percent).toBe(40);
  });

  it('getDailySeries produces zero-filled series for all days of the month', () => {
    const series = getDailySeries(mockTransactions, '2026-09');
    expect(series.length).toBe(30); // Sep has 30 days
    expect(series[1].day).toBe(2);
    expect(series[1].amount).toBe(1200);
    expect(series[14].day).toBe(15);
    expect(series[14].amount).toBe(800);
    expect(series[0].amount).toBe(0); // Day 1 expense is 0 (tx-3 was income)
  });

  it('getMonthlySeries returns zero-filled array of N months', () => {
    const series = getMonthlySeries(mockTransactions, {}, mockSettings, '2026-09', 3);
    expect(series.length).toBe(3);
    expect(series[2].monthKey).toBe('2026-09');
    expect(series[2].expense).toBe(2000);
    expect(series[1].monthKey).toBe('2026-08');
    expect(series[1].expense).toBe(500);
    expect(series[0].monthKey).toBe('2026-07');
    expect(series[0].expense).toBe(0);
  });

  it('getSavings calculates saved, overspent and percent used', () => {
    const under = getSavings(10000, 4000);
    expect(under.saved).toBe(6000);
    expect(under.overspent).toBe(0);
    expect(under.percentUsed).toBe(40);

    const over = getSavings(10000, 12000);
    expect(over.saved).toBe(0);
    expect(over.overspent).toBe(2000);
    expect(over.percentUsed).toBe(120);
  });

  it('getProjectedSpend calculates linear projection', () => {
    expect(getProjectedSpend(5000, 10, 30)).toBe(15000);
    expect(getProjectedSpend(0, 10, 30)).toBe(0);
    expect(getProjectedSpend(5000, 0, 30)).toBe(0);
  });

  it('getSavingsRate computes savings rate correctly', () => {
    expect(getSavingsRate(100000, 40000)).toBe(60);
    expect(getSavingsRate(0, 1000)).toBe(0);
  });
});
