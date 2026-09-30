import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../motion/useReducedMotion';
import { formatCurrency } from '../lib/format';

interface BudgetMeterProps {
  spent: number;
  budget: number;
  currencySymbol?: string;
  locale?: string;
  dayOfMonth: number;
  daysInMonth: number;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({
  spent,
  budget,
  currencySymbol = '₹',
  locale = 'en-IN',
  dayOfMonth,
  daysInMonth
}) => {
  const reducedMotion = useReducedMotion();
  const [sheenKey, setSheenKey] = useState<number>(0);

  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const scaleValue = clampedPercent / 100;

  // Trigger sheen animation whenever spent/budget changes
  useEffect(() => {
    setSheenKey(prev => prev + 1);
  }, [spent, budget]);

  // Color state logic
  let fillColor = '#1A9E5F'; // success
  if (percent > 100) {
    fillColor = '#A8253F'; // dark red over 100%
  } else if (percent > 90) {
    fillColor = '#D64545'; // danger
  } else if (percent >= 70) {
    fillColor = '#C8811A'; // warning
  }

  // Pace calculations
  const dailySpendRate = dayOfMonth > 0 ? spent / dayOfMonth : 0;
  const budgetPace = daysInMonth > 0 ? budget / daysInMonth : 0;

  return (
    <div className="card-static mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-semibold text-[var(--text-primary)]"
            title="Share of this month's budget you have spent so far."
          >
            Monthly Budget Usage
          </span>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            ({Math.round(percent)}% of {formatCurrency(budget, currencySymbol, locale)})
          </span>
        </div>
        <div className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">
          {formatCurrency(spent, currencySymbol, locale)} / {formatCurrency(budget, currencySymbol, locale)}
        </div>
      </div>

      {/* The Ribbon capsule container */}
      <div
        className={`relative w-full h-3.5 rounded-full overflow-hidden bg-[var(--bg-inset)] border ${
          percent > 100 ? 'border-[var(--danger)] ring-1 ring-[var(--danger)]' : 'border-[var(--border)]'
        }`}
      >
        {/* Milestone hairline ticks at 70%, 90%, 100% */}
        <div className="absolute top-0 bottom-0 left-[70%] w-px bg-[var(--border-strong)] z-20 opacity-60" />
        <div className="absolute top-0 bottom-0 left-[90%] w-px bg-[var(--border-strong)] z-20 opacity-60" />
        <div className="absolute top-0 bottom-0 left-[100%] w-px bg-[var(--border-strong)] z-20 opacity-60" />

        {/* Animated fill using transform scaleX */}
        <motion.div
          className="absolute inset-0 rounded-full origin-left overflow-hidden"
          initial={false}
          animate={{
            scaleX: scaleValue,
            backgroundColor: fillColor
          }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: [0.16, 1, 0.30, 1] }
          }
        >
          {/* Meter sheen sweep */}
          {!reducedMotion && (
            <div
              key={sheenKey}
              className="absolute inset-0 w-1/3 h-full animate-meter-sheen pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent)'
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Pace footer note */}
      <div className="mt-3 text-xs text-[var(--text-secondary)] flex items-center justify-between">
        <span>
          Day {dayOfMonth} of {daysInMonth}. Your average so far is{' '}
          <strong className="text-[var(--text-primary)] font-medium">
            {formatCurrency(dailySpendRate, currencySymbol, locale)}/day
          </strong>
          ; spending{' '}
          <strong
            className="text-[var(--text-primary)] font-medium"
            title="Spend this much each day and you would use the whole budget exactly by month end."
          >
            {formatCurrency(budgetPace, currencySymbol, locale)}/day
          </strong>{' '}
          evenly would use the budget exactly.
        </span>
        <span className="text-[var(--text-muted)] text-[11px]">
          {percent > 100 ? 'Over budget' : `${Math.round(100 - percent)}% of budget left`}
        </span>
      </div>
    </div>
  );
};
