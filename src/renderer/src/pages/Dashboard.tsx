import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AuroraHeader } from '../components/AuroraHeader';
import { MonthPicker } from '../components/MonthPicker';
import { StatCard } from '../components/StatCard';
import { BudgetMeter } from '../components/BudgetMeter';
import { CategoryDonut } from '../components/CategoryDonut';
import { DailyBarChart } from '../components/DailyBarChart';
import { SuggestionList } from '../components/SuggestionList';
import { EmptyState } from '../components/EmptyState';
import { formatMonthYear, formatCurrency, formatDate } from '../lib/format';
import {
  getMonthTotals,
  getBudgetForMonth,
  getCategoryBreakdown,
  getDailySeries,
  getSavings
} from '../lib/calc';
import { generateSuggestions } from '../lib/suggestions';
import { getDaysInMonth, format } from 'date-fns';
import { motion } from 'motion/react';
import { staggerContainer } from '../motion/variants';
import { useReducedMotion } from '../motion/useReducedMotion';
import { ArrowRight, Plus, Info, X } from 'lucide-react';

const WELCOME_DISMISS_KEY = 'spendledger.hideWelcome';

function readWelcomeDismissed(): boolean {
  try {
    return localStorage.getItem(WELCOME_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export const Dashboard: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(readWelcomeDismissed);

  const dismissWelcome = (): void => {
    setWelcomeDismissed(true);
    try {
      localStorage.setItem(WELCOME_DISMISS_KEY, '1');
    } catch {
      /* localStorage unavailable — dismiss for this session only */
    }
  };

  const {
    data,
    selectedMonth,
    setSelectedMonth,
    openAddModal,
    setActivePage,
    dismissedSuggestions,
    dismissSuggestion
  } = useAppStore();

  if (!data) return null;

  const { settings, categories, transactions, monthlyBudgets } = data;
  const currencySymbol = settings.currencySymbol || '₹';
  const locale = settings.locale || 'en-IN';

  // Month calculations
  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const daysInMonth = getDaysInMonth(monthDate);

  const realNow = new Date();
  const realNowMonthKey = format(realNow, 'yyyy-MM');
  let dayOfMonth = daysInMonth;
  if (selectedMonth === realNowMonthKey) {
    dayOfMonth = Math.min(realNow.getDate(), daysInMonth);
  }

  const totals = useMemo(
    () => getMonthTotals(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const budget = useMemo(
    () => getBudgetForMonth(monthlyBudgets, settings, selectedMonth),
    [monthlyBudgets, settings, selectedMonth]
  );
  const { saved, overspent, percentUsed } = useMemo(
    () => getSavings(budget, totals.expense),
    [budget, totals.expense]
  );

  const remaining = budget - totals.expense;
  const isOverBudget = remaining < 0;

  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(transactions, categories, selectedMonth),
    [transactions, categories, selectedMonth]
  );

  const dailySeries = useMemo(
    () => getDailySeries(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const dailyBudgetPace = daysInMonth > 0 ? budget / daysInMonth : 0;

  // Rules engine suggestions
  const rawSuggestions = useMemo(() => {
    return generateSuggestions({
      month: selectedMonth,
      transactions,
      categories,
      budget,
      settings,
      today: realNow
    });
  }, [selectedMonth, transactions, categories, budget, settings]);

  const activeSuggestions = rawSuggestions.filter(s => !dismissedSuggestions.has(s.id));

  // Recent 8 transactions for this month
  const recentMonthTx = useMemo(() => {
    return transactions
      .filter(t => t.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [transactions, selectedMonth]);

  const catMap = useMemo(() => {
    const map = new Map<string, (typeof categories)[0]>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const hasTransactions = totals.count > 0;
  const isClosedUnderBudget = !isOverBudget && totals.expense > 0;

  const hasMonthOverride = monthlyBudgets[selectedMonth] !== undefined;
  const showWelcome = !welcomeDismissed && transactions.length < 3;

  return (
    <div key={selectedMonth} className="space-y-6">
      {showWelcome && (
        <aside className="card-static border-l-4 border-l-[var(--accent)] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">New to SpendLedger?</h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                This is a private, offline tracker — nothing syncs and no bank is connected.
                You type in each expense and income yourself. Three things to do first:
              </p>
              <ol className="text-xs text-[var(--text-secondary)] leading-relaxed list-decimal pl-4 space-y-0.5">
                <li>
                  Open <strong className="text-[var(--text-primary)] font-medium">Settings</strong> and set your real
                  monthly budget (it starts at a placeholder value).
                </li>
                <li>
                  Use <strong className="text-[var(--text-primary)] font-medium">New Transaction</strong> to log what
                  you spend and earn.
                </li>
                <li>
                  Check back through the month — the charts, budget meter and savings tips fill in as you go.
                </li>
              </ol>
            </div>
          </div>
          <button
            onClick={dismissWelcome}
            aria-label="Dismiss welcome message"
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </aside>
      )}

      {/* Aurora Ambient Header with Month Title & Month Picker */}
      <AuroraHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[34px] leading-tight text-[var(--text-primary)]">
              {formatMonthYear(selectedMonth)}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Monthly overview and financial breakdown
            </p>
          </div>

          <MonthPicker currentMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </div>
      </AuroraHeader>

      {/* 4 Stat Cards in a row */}
      <motion.div
        variants={reducedMotion ? {} : staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <StatCard
          label="Monthly Budget"
          value={budget}
          currencySymbol={currencySymbol}
          locale={locale}
          deltaText={hasMonthOverride ? 'Custom for this month' : 'Default — edit in Settings'}
          deltaType="neutral"
        />

        <StatCard
          label="Spent This Month"
          value={totals.expense}
          currencySymbol={currencySymbol}
          locale={locale}
          isHero={true}
          deltaText={`${Math.round(percentUsed)}% of budget`}
          deltaType={percentUsed > 90 ? 'danger' : 'neutral'}
        />

        <StatCard
          label="Remaining Balance"
          value={remaining}
          currencySymbol={currencySymbol}
          locale={locale}
          deltaText={isOverBudget ? 'Over budget' : 'Under budget'}
          deltaType={isOverBudget ? 'danger' : 'success'}
        />

        <StatCard
          label="Saved This Month"
          value={saved}
          currencySymbol={currencySymbol}
          locale={locale}
          enableShimmer={isClosedUnderBudget}
          deltaText={
            isOverBudget
              ? `Over budget by ${formatCurrency(overspent, currencySymbol, locale)}`
              : saved > 0
              ? 'Surplus saved'
              : undefined
          }
          deltaType={isOverBudget ? 'danger' : 'success'}
        />
      </motion.div>

      {/* Empty State if month has no transactions */}
      {!hasTransactions ? (
        <EmptyState
          title={`No transactions logged for ${formatMonthYear(selectedMonth)}`}
          description="Log your income and expenses to view category breakdowns, daily spending charts, and smart saving suggestions."
          actionText="Add first transaction"
          onAction={() => openAddModal()}
          hint={
            <ul className="list-disc pl-4 space-y-1">
              <li>Set your real monthly budget in Settings — it starts at a placeholder amount.</li>
              <li>Add every expense and income by hand; nothing syncs automatically.</li>
              <li>Come back through the month to watch the charts and savings tips fill in.</li>
            </ul>
          }
        />
      ) : (
        <>
          {/* Ribbon Budget Meter */}
          <BudgetMeter
            spent={totals.expense}
            budget={budget}
            currencySymbol={currencySymbol}
            locale={locale}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
          />

          {/* Two Charts Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CategoryDonut
              categories={categoryBreakdown}
              currencySymbol={currencySymbol}
              locale={locale}
              monthKey={selectedMonth}
            />

            <DailyBarChart
              data={dailySeries}
              dailyBudgetPace={dailyBudgetPace}
              currencySymbol={currencySymbol}
              locale={locale}
              monthKey={selectedMonth}
            />
          </div>

          {/* Suggestions Panel */}
          <SuggestionList suggestions={activeSuggestions} onDismiss={dismissSuggestion} />

          {/* Recent 8 Transactions */}
          <div className="card-static">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Recent Transactions ({formatMonthYear(selectedMonth)})
              </h2>
              <button
                onClick={() => setActivePage('transactions')}
                className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {recentMonthTx.map(tx => {
                const cat = catMap.get(tx.categoryId);
                return (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between gap-4 text-xs hover:bg-[var(--bg-subtle)] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat?.color || '#8C867A' }}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] truncate">
                          {tx.description || cat?.name || 'Transaction'}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {formatDate(tx.date, 'dd MMM yyyy')} • {tx.paymentMethod.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p
                        className={`font-semibold tabular-nums text-sm ${
                          tx.type === 'expense' ? 'text-[var(--text-primary)]' : 'text-[var(--success)]'
                        }`}
                      >
                        {tx.type === 'expense' ? '-' : '+'}
                        {formatCurrency(tx.amount, currencySymbol, locale, 2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
