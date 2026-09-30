import { describe, it, expect } from 'vitest';
import { generateSuggestions } from '../src/renderer/src/lib/suggestions';
import { Transaction, Category, Settings } from '../src/renderer/src/types/models';

const categories: Category[] = [
  { id: 'cat-groceries', name: 'Food & Groceries', color: '#4F46E5', discretionary: false, archived: false },
  { id: 'cat-dining', name: 'Dining Out', color: '#1A9E5F', discretionary: true, archived: false },
  { id: 'cat-shopping', name: 'Shopping', color: '#DB2777', discretionary: true, archived: false },
  { id: 'cat-rent', name: 'Rent', color: '#7C3AED', discretionary: false, archived: false }
];

const settings: Settings = {
  currencySymbol: '₹',
  locale: 'en-IN',
  defaultMonthlyBudget: 20000,
  savingsGoalPercent: 20,
  firstRunCompleted: true
};

const fixedToday = new Date(2026, 8, 15); // 15 Sep 2026

function makeTx(partial: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(),
    type: 'expense',
    amount: 1000,
    date: '2026-09-10',
    categoryId: 'cat-groceries',
    description: '',
    paymentMethod: 'upi',
    note: '',
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
    ...partial
  };
}

describe('Suggestions Rules Engine (suggestions.ts)', () => {
  it('Rule 1: over-budget fires when spend exceeds budget', () => {
    const txs: Transaction[] = [
      makeTx({ amount: 15000, date: '2026-09-02' }),
      makeTx({ amount: 10000, date: '2026-09-05' }),
      makeTx({ amount: 2000, date: '2026-09-10' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'over-budget');
    expect(rule).toBeDefined();
    expect(rule?.tone).toBe('critical');
    expect(rule?.body).toContain('7,000');
  });

  it('Rule 2: pace-ahead fires when projected spend exceeds budget by > 5%', () => {
    const txs: Transaction[] = [
      makeTx({ amount: 7000, date: '2026-09-02' }),
      makeTx({ amount: 5000, date: '2026-09-05' }),
      makeTx({ amount: 2000, date: '2026-09-10' })
    ];
    // 14000 spent in 15 days -> 28000 projected (budget is 20000)
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'pace-ahead');
    expect(rule).toBeDefined();
    expect(rule?.tone).toBe('critical');
  });

  it('Rule 3: category-dominant fires when one category is > 35% of spend', () => {
    const txs: Transaction[] = [
      makeTx({ amount: 6000, categoryId: 'cat-groceries', date: '2026-09-02' }),
      makeTx({ amount: 1000, categoryId: 'cat-dining', date: '2026-09-05' }),
      makeTx({ amount: 1000, categoryId: 'cat-shopping', date: '2026-09-10' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'category-dominant');
    expect(rule).toBeDefined();
    expect(rule?.title).toContain('Food & Groceries');
  });

  it('Rule 4: discretionary-high fires when discretionary spend > 30%', () => {
    const txs: Transaction[] = [
      makeTx({ amount: 2000, categoryId: 'cat-groceries', date: '2026-09-02' }),
      makeTx({ amount: 4000, categoryId: 'cat-dining', date: '2026-09-05' }), // discretionary
      makeTx({ amount: 2000, categoryId: 'cat-shopping', date: '2026-09-10' }) // discretionary
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'discretionary-high');
    expect(rule).toBeDefined();
    expect(rule?.potentialSaving).toBeGreaterThan(0);
  });

  it('Rule 5: category-spike fires when a category is >25% above 3-month average', () => {
    const txs: Transaction[] = [
      // 3 prev months at 1000 each in shopping
      makeTx({ amount: 1000, categoryId: 'cat-shopping', date: '2026-08-05' }),
      makeTx({ amount: 1000, categoryId: 'cat-shopping', date: '2026-07-05' }),
      makeTx({ amount: 1000, categoryId: 'cat-shopping', date: '2026-06-05' }),
      // current month shopping is 3000 (3x average)
      makeTx({ amount: 3000, categoryId: 'cat-shopping', date: '2026-09-05' }),
      makeTx({ amount: 500, categoryId: 'cat-groceries', date: '2026-09-06' }),
      makeTx({ amount: 500, categoryId: 'cat-groceries', date: '2026-09-07' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'category-spike');
    expect(rule).toBeDefined();
    expect(rule?.title).toContain('Shopping');
  });

  it('Rule 6: recurring-detected detects repeating descriptions', () => {
    const txs: Transaction[] = [
      makeTx({ amount: 499, description: 'Netflix', date: '2026-09-05' }),
      makeTx({ amount: 499, description: 'Netflix', date: '2026-08-05' }),
      makeTx({ amount: 499, description: 'Netflix', date: '2026-07-05' }),
      makeTx({ amount: 2000, date: '2026-09-06' }),
      makeTx({ amount: 2000, date: '2026-09-07' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'recurring-detected');
    expect(rule).toBeDefined();
    expect(rule?.body).toContain('5,988'); // 499 * 12
  });

  it('Rule 7: small-frequent detects 10+ micro transactions', () => {
    const txs: Transaction[] = [];
    // Budget 20000 -> 5% is 1000. Create 10 items of 300 in Groceries
    for (let i = 1; i <= 10; i++) {
      txs.push(makeTx({ amount: 300, categoryId: 'cat-groceries', date: `2026-09-${i.toString().padStart(2, '0')}` }));
    }
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'small-frequent');
    expect(rule).toBeDefined();
    expect(rule?.body).toContain('10 small purchases');
  });

  it('Rule 8: savings-rate-low fires when actual rate is below goal', () => {
    const txs: Transaction[] = [
      makeTx({ type: 'income', amount: 50000, date: '2026-09-01' }),
      makeTx({ type: 'expense', amount: 45000, date: '2026-09-05' }), // saved 5000 -> 10% (goal is 20%)
      makeTx({ type: 'expense', amount: 1000, date: '2026-09-06' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 50000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'savings-rate-low');
    expect(rule).toBeDefined();
  });

  it('Rule 9: weekend-heavy fires when weekend spend > 40%', () => {
    // 2026-09-12 is Saturday, 2026-09-13 is Sunday
    const txs: Transaction[] = [
      makeTx({ amount: 6000, date: '2026-09-12' }), // Sat
      makeTx({ amount: 2000, date: '2026-09-10' }), // Thu
      makeTx({ amount: 2000, date: '2026-09-11' })  // Fri
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'weekend-heavy');
    expect(rule).toBeDefined();
  });

  it('Rule 10: on-track fires when spend < 70% with > 1/3 month elapsed', () => {
    // 15 days elapsed (half month), 3000 spent out of 20000 (15%)
    const txs: Transaction[] = [
      makeTx({ amount: 1000, date: '2026-09-02' }),
      makeTx({ amount: 1000, date: '2026-09-05' }),
      makeTx({ amount: 1000, date: '2026-09-10' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'on-track');
    expect(rule).toBeDefined();
    expect(rule?.tone).toBe('positive');
  });

  it('Rule 11: surplus-idle fires when previous month has > 10% surplus', () => {
    const txs: Transaction[] = [
      makeTx({ amount: 5000, date: '2026-08-10' }), // prev month spent 5000 out of 20000 budget
      makeTx({ amount: 1000, date: '2026-09-02' }),
      makeTx({ amount: 1000, date: '2026-09-05' }),
      makeTx({ amount: 1000, date: '2026-09-10' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'surplus-idle');
    expect(rule).toBeDefined();
    expect(rule?.tone).toBe('positive');
  });

  it('Rule 12: no-data fires when fewer than 3 transactions', () => {
    const txs: Transaction[] = [
      makeTx({ amount: 1000, date: '2026-09-02' })
    ];
    const res = generateSuggestions({
      month: '2026-09',
      transactions: txs,
      categories,
      budget: 20000,
      settings,
      today: fixedToday
    });
    const rule = res.find(s => s.id === 'no-data');
    expect(rule).toBeDefined();
    expect(rule?.tone).toBe('info');
  });
});
