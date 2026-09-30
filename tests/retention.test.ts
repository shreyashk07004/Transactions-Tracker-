import { describe, it, expect } from 'vitest';
import { runRetention } from '../src/main/retention';
import { AppData, Transaction } from '../src/renderer/src/types/models';

function makeTx(date: string, id: string): Transaction {
  return {
    id,
    type: 'expense',
    amount: 500,
    date,
    categoryId: 'cat-1',
    description: 'Item ' + id,
    paymentMethod: 'upi',
    note: '',
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`
  };
}

const baseData: AppData = {
  schemaVersion: 1,
  settings: {
    currencySymbol: '₹',
    locale: 'en-IN',
    defaultMonthlyBudget: 25000,
    savingsGoalPercent: 20,
    firstRunCompleted: true
  },
  categories: [],
  transactions: [],
  monthlyBudgets: {},
  archivedMonths: []
};

const fixedToday = new Date(2026, 8, 15); // Sep 2026.
// Window is Sep 2026 backwards 36 months: Sep 2026 (month 1) back to Oct 2023 (month 36).
// Sep 2023 is month 37 -> should be archived.

describe('Retention System (retention.ts)', () => {
  it('keeps exactly 36 months and archives the 37th month', () => {
    const tx36 = makeTx('2023-10-01', 'tx-month36'); // 36th month (kept)
    const tx37 = makeTx('2023-09-30', 'tx-month37'); // 37th month (archived)
    const txNow = makeTx('2026-09-15', 'tx-now');     // Current month (kept)

    const data: AppData = {
      ...baseData,
      transactions: [tx36, tx37, txNow]
    };

    const { updatedData, archivedCount } = runRetention(data, '', fixedToday);

    expect(archivedCount).toBe(1);
    expect(updatedData.transactions.map(t => t.id)).toEqual(['tx-month36', 'tx-now']);
    expect(updatedData.archivedMonths).toContain('2023-09');
  });

  it('handles an empty dataset without errors', () => {
    const data: AppData = { ...baseData, transactions: [] };
    const { updatedData, archivedCount } = runRetention(data, '', fixedToday);

    expect(archivedCount).toBe(0);
    expect(updatedData.transactions).toEqual([]);
    expect(updatedData.archivedMonths).toEqual([]);
  });

  it('leaves a dataset entirely inside the 36-month window untouched', () => {
    const tx1 = makeTx('2026-08-01', 'tx-1');
    const tx2 = makeTx('2025-01-15', 'tx-2');
    const tx3 = makeTx('2024-05-20', 'tx-3');
    const tx4 = makeTx('2023-10-15', 'tx-4'); // Oct 2023 is inside 36-month window

    const data: AppData = {
      ...baseData,
      transactions: [tx1, tx2, tx3, tx4]
    };

    const { updatedData, archivedCount } = runRetention(data, '', fixedToday);

    expect(archivedCount).toBe(0);
    expect(updatedData.transactions.length).toBe(4);
    expect(updatedData.archivedMonths).toEqual([]);
  });
});
