import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { useReducedMotion } from '../motion/useReducedMotion';
import { formatCurrency } from '../lib/format';

interface DailyBarChartProps {
  data: Array<{ day: number; dateStr: string; amount: number; isToday: boolean }>;
  dailyBudgetPace: number;
  currencySymbol?: string;
  locale?: string;
  monthKey: string;
}

const CustomTooltip = ({ active, payload, label, currencySymbol, locale }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg p-2.5 shadow-lg text-xs">
        <p className="font-semibold text-[var(--text-primary)] mb-1">
          {item.dateStr} {item.isToday ? '(Today)' : ''}
        </p>
        <p className="text-[var(--accent)] font-medium tabular-nums">
          Spend: {formatCurrency(item.amount, currencySymbol, locale)}
        </p>
      </div>
    );
  }
  return null;
};

export const DailyBarChart: React.FC<DailyBarChartProps> = ({
  data,
  dailyBudgetPace,
  currencySymbol = '₹',
  locale = 'en-IN',
  monthKey
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="card-static flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Daily Spending</h2>
        <span
          className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"
          title="Spending this much each day would use the whole budget exactly by month end."
        >
          <span className="w-3 border-b-2 border-dashed border-[var(--text-muted)] inline-block" />
          Even pace {formatCurrency(dailyBudgetPace, currencySymbol, locale)}/day
        </span>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart key={monthKey} data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="day"
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
              content={<CustomTooltip currencySymbol={currencySymbol} locale={locale} />}
              cursor={{ fill: 'var(--bg-subtle)', opacity: 0.5 }}
            />
            {dailyBudgetPace > 0 && (
              <ReferenceLine
                y={dailyBudgetPace}
                stroke="var(--text-muted)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            <Bar
              dataKey="amount"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
              animationDuration={400}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell
                  key={`bar-${entry.day}`}
                  fill={entry.amount > dailyBudgetPace * 1.5 ? '#C8811A' : 'var(--accent)'}
                  opacity={entry.amount === 0 ? 0.2 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pulsing today marker legend note */}
      <div className="mt-2 text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 justify-end">
        <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-today-dot inline-block" />
        <span>Today indicator</span>
      </div>
    </div>
  );
};
