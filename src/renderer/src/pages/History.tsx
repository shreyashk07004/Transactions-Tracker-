import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TrendLineChart } from '../components/TrendLineChart';
import { formatCurrency, formatMonthYear } from '../lib/format';
import { getMonthlySeries } from '../lib/calc';
import { format, subMonths } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { useReducedMotion } from '../motion/useReducedMotion';
import { TrendingUp, FolderArchive, ArrowUpRight } from 'lucide-react';

export const History: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const { data, setSelectedMonth, setActivePage } = useAppStore();

  if (!data) return null;

  const { settings, categories, transactions, monthlyBudgets, archivedMonths } = data;
  const currencySymbol = settings.currencySymbol || '₹';
  const locale = settings.locale || 'en-IN';

  const currentMonthKey = format(new Date(), 'yyyy-MM');

  // 36-month monthly series
  const monthlyData36 = useMemo(() => {
    return getMonthlySeries(transactions, monthlyBudgets, settings, currentMonthKey, 36);
  }, [transactions, monthlyBudgets, settings, currentMonthKey]);

  // Last 12 months category stacked bar data
  const last12MonthsStacked = useMemo(() => {
    const baseDate = new Date();
    const result = [];

    const activeCats = categories.slice(0, 8); // top 8 categories for clean stacked bars

    for (let i = 11; i >= 0; i--) {
      const d = subMonths(baseDate, i);
      const mKey = format(d, 'yyyy-MM');
      const mLabel = format(d, 'MMM');
      const monthTx = transactions.filter(t => t.date.startsWith(mKey) && t.type === 'expense');

      const row: Record<string, any> = {
        monthKey: mKey,
        label: mLabel
      };

      for (const cat of activeCats) {
        const catSum = monthTx
          .filter(t => t.categoryId === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        row[cat.id] = catSum;
      }

      result.push(row);
    }
    return result;
  }, [transactions, categories]);

  // Summary strip metrics across all active months with transactions
  const summaryStrip = useMemo(() => {
    const activeMonthsWithData = monthlyData36.filter(m => m.count > 0);
    if (activeMonthsWithData.length === 0) {
      return {
        totalSaved: 0,
        bestMonth: null,
        worstMonth: null,
        avgSpend: 0
      };
    }

    let totalSaved = 0;
    let totalSpend = 0;
    let best = activeMonthsWithData[0];
    let worst = activeMonthsWithData[0];

    for (const m of activeMonthsWithData) {
      totalSaved += m.saved;
      totalSpend += m.expense;
      if (m.saved > best.saved) best = m;
      if (m.saved < worst.saved) worst = m;
    }

    const avgSpend = totalSpend / activeMonthsWithData.length;

    return {
      totalSaved,
      bestMonth: best,
      worstMonth: worst,
      avgSpend
    };
  }, [monthlyData36]);

  const handleMonthClick = (mKey: string): void => {
    setSelectedMonth(mKey);
    setActivePage('dashboard');
  };

  const handleOpenDataFolder = (): void => {
    if (window.api) {
      window.api.openDataFolder();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-[34px] leading-tight text-[var(--text-primary)]">
          Financial History
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          36-month spending trends, historical savings rate, and category growth
        </p>
      </div>

      {/* Summary Strip (4 KPI chips) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card-static p-4">
          <p className="text-[11px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
            Total Saved (36 Months)
          </p>
          <p className="text-xl font-bold tabular-nums text-[var(--success)] mt-1">
            {formatCurrency(summaryStrip.totalSaved, currencySymbol, locale)}
          </p>
        </div>

        <div className="card-static p-4">
          <p className="text-[11px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
            Best Saving Month
          </p>
          <p className="text-xl font-bold tabular-nums text-[var(--text-primary)] mt-1">
            {summaryStrip.bestMonth
              ? `${summaryStrip.bestMonth.label} (${formatCurrency(summaryStrip.bestMonth.saved, currencySymbol, locale)})`
              : '—'}
          </p>
        </div>

        <div className="card-static p-4">
          <p className="text-[11px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
            Highest Spend Month
          </p>
          <p className="text-xl font-bold tabular-nums text-[var(--danger)] mt-1">
            {summaryStrip.worstMonth
              ? `${summaryStrip.worstMonth.label} (${formatCurrency(summaryStrip.worstMonth.expense, currencySymbol, locale)})`
              : '—'}
          </p>
        </div>

        <div className="card-static p-4">
          <p className="text-[11px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
            Average Monthly Spend
          </p>
          <p className="text-xl font-bold tabular-nums text-[var(--accent)] mt-1">
            {formatCurrency(summaryStrip.avgSpend, currencySymbol, locale)}
          </p>
        </div>
      </div>

      {/* 36-Month Spend vs Budget Line Chart */}
      <TrendLineChart data={monthlyData36} currencySymbol={currencySymbol} locale={locale} />

      {/* Last 12 Months Category Growth Stacked Bar Chart */}
      <div className="card-static">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          Last 12 Months: Category Breakdown Trend
        </h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last12MonthsStacked} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={val => `${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
              />
              <Tooltip
                formatter={(val: any, name: any) => {
                  const cat = categories.find(c => c.id === name);
                  return [formatCurrency(Number(val) || 0, currencySymbol, locale), cat?.name || name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={value => {
                  const cat = categories.find(c => c.id === value);
                  return <span className="text-[var(--text-secondary)]">{cat?.name || value}</span>;
                }}
              />
              {categories.slice(0, 8).map(cat => (
                <Bar
                  key={cat.id}
                  dataKey={cat.id}
                  stackId="a"
                  fill={cat.color}
                  isAnimationActive={!reducedMotion}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 36-Month Table View */}
      <div className="card-static">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          36-Month Detailed History Table
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Click on any row to open the Dashboard for that month.
        </p>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-muted)] uppercase font-semibold">
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-right">Budget</th>
                <th className="py-3 px-4 text-right">Spent</th>
                <th className="py-3 px-4 text-right">Saved</th>
                <th className="py-3 px-4 text-right">Savings Rate</th>
                <th className="py-3 px-4 text-right">Transactions</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {monthlyData36.map(row => {
                const isOver = row.saved < 0;

                return (
                  <tr
                    key={row.monthKey}
                    onClick={() => handleMonthClick(row.monthKey)}
                    className="h-10 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer group"
                  >
                    <td className="py-2 px-4 font-semibold text-[var(--text-primary)]">
                      {formatMonthYear(row.monthKey)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-[var(--text-secondary)]">
                      {formatCurrency(row.budget, currencySymbol, locale)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums font-medium text-[var(--text-primary)]">
                      {formatCurrency(row.expense, currencySymbol, locale)}
                    </td>
                    <td
                      className={`py-2 px-4 text-right tabular-nums font-semibold ${
                        isOver ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                      }`}
                    >
                      {formatCurrency(row.saved, currencySymbol, locale)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-[var(--text-secondary)]">
                      {Math.round(row.savingsRate)}%
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-[var(--text-muted)]">
                      {row.count}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className="inline-flex items-center text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archive notice if older data has been archived */}
      {archivedMonths && archivedMonths.length > 0 && (
        <div className="card-static bg-[var(--bg-subtle)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <FolderArchive className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
            <span>Older records ({archivedMonths.join(', ')}) are archived to your local archive folder.</span>
          </div>
          <button onClick={handleOpenDataFolder} className="btn-secondary text-xs h-8">
            Open Archive Folder
          </button>
        </div>
      )}
    </div>
  );
};
