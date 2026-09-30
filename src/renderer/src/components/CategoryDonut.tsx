import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { useReducedMotion } from '../motion/useReducedMotion';
import { formatCurrency } from '../lib/format';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryItem {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  percent: number;
}

interface CategoryDonutProps {
  categories: CategoryItem[];
  currencySymbol?: string;
  locale?: string;
  monthKey: string;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4} // lifts outward 4px
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const CategoryDonut: React.FC<CategoryDonutProps> = ({
  categories,
  currencySymbol = '₹',
  locale = 'en-IN',
  monthKey
}) => {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);
  const activeCategory = activeIndex !== null ? categories[activeIndex] : null;

  return (
    <div className="card-static flex flex-col h-full">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Spend by Category</h2>

      {categories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm py-12">
          No expenses recorded this month
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Donut Chart Container */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart key={monthKey}>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="amount"
                  {...({ activeIndex: activeIndex !== null ? activeIndex : undefined } as any)}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  isAnimationActive={!reducedMotion}
                  animationDuration={500}
                  animationEasing="ease-out"
                >
                  {categories.map(entry => (
                    <Cell key={`cell-${entry.categoryId}`} fill={entry.color} stroke="var(--bg-surface)" strokeWidth={1.5} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Living center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              <AnimatePresence mode="wait">
                {activeCategory ? (
                  <motion.div
                    key={`active-${activeCategory.categoryId}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[11px] font-medium text-[var(--text-muted)] truncate max-w-[85px]">
                      {activeCategory.categoryName}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(activeCategory.amount, currencySymbol, locale)}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                      {Math.round(activeCategory.percent)}%
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Total
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(totalExpense, currencySymbol, locale)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sorted Legend */}
          <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
            {categories.map((c, idx) => (
              <div
                key={c.categoryId}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeIndex === idx ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="truncate text-[var(--text-primary)] font-medium">{c.categoryName}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-[var(--text-secondary)] tabular-nums">
                    {formatCurrency(c.amount, currencySymbol, locale)}
                  </span>
                  <span className="text-[var(--text-muted)] tabular-nums w-8 text-right font-medium">
                    {Math.round(c.percent)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
