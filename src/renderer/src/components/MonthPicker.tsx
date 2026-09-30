import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthYear } from '../lib/format';
import { subMonths, addMonths, format } from 'date-fns';

interface MonthPickerProps {
  currentMonth: string; // "YYYY-MM"
  onMonthChange: (newMonth: string) => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ currentMonth, onMonthChange }) => {
  const [yearStr, monthStr] = currentMonth.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);

  const realNowMonthKey = format(new Date(), 'yyyy-MM');
  const isLatestMonth = currentMonth >= realNowMonthKey;

  const handlePrev = (): void => {
    const prev = subMonths(dateObj, 1);
    onMonthChange(format(prev, 'yyyy-MM'));
  };

  const handleNext = (): void => {
    if (isLatestMonth) return;
    const next = addMonths(dateObj, 1);
    const nextKey = format(next, 'yyyy-MM');
    if (nextKey <= realNowMonthKey) {
      onMonthChange(nextKey);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-1 shadow-sm">
        <button
          onClick={handlePrev}
          aria-label="Previous Month"
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-[var(--text-primary)] select-none">
          <Calendar className="w-4 h-4 text-[var(--accent)]" />
          <span>{formatMonthYear(currentMonth)}</span>
        </div>

        <button
          onClick={handleNext}
          disabled={isLatestMonth}
          aria-label="Next Month"
          className={`p-1.5 rounded-lg transition-all ${
            isLatestMonth
              ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:scale-95'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {!isLatestMonth && (
        <button
          onClick={() => onMonthChange(realNowMonthKey)}
          className="text-xs font-medium text-[var(--accent)] hover:underline px-2 py-1"
        >
          Jump to Current
        </button>
      )}
    </div>
  );
};
