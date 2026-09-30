import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { useReducedMotion } from '../motion/useReducedMotion';
import { formatCurrency } from '../lib/format';

interface MonthlyDataPoint {
  monthKey: string;
  label: string;
  expense: number;
  income: number;
  budget: number;
  saved: number;
}

interface TrendLineChartProps {
  data: MonthlyDataPoint[];
  currencySymbol?: string;
  locale?: string;
}

const CustomTooltip = ({ active, payload, label, currencySymbol, locale }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg p-3 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-[var(--text-primary)]">{item.label}</p>
        <p className="text-[var(--accent)] font-medium tabular-nums">
          Spend: {formatCurrency(item.expense, currencySymbol, locale)}
        </p>
        <p className="text-[var(--text-muted)] font-medium tabular-nums">
          Budget: {formatCurrency(item.budget, currencySymbol, locale)}
        </p>
        <p className={item.saved >= 0 ? 'text-[var(--success)] font-medium' : 'text-[var(--danger)] font-medium'}>
          {item.saved >= 0 ? 'Saved: ' : 'Overspent: '}
          {formatCurrency(Math.abs(item.saved), currencySymbol, locale)}
        </p>
      </div>
    );
  }
  return null;
};

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  currencySymbol = '₹',
  locale = 'en-IN'
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="card-static flex flex-col h-full">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">36-Month Spend vs Budget</h2>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={val => `${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
            />
            <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} locale={locale} />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={value => (
                <span className="text-[var(--text-secondary)] font-medium capitalize">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Spend"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: 'var(--accent)' }}
              activeDot={{ r: 5 }}
              isAnimationActive={!reducedMotion}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="budget"
              name="Budget"
              stroke="var(--text-muted)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={!reducedMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
