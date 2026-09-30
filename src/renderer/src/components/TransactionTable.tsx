import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Transaction } from '../types/models';
import { formatCurrency, formatDate } from '../lib/format';
import { useReducedMotion } from '../motion/useReducedMotion';
import { ArrowUpDown, Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol?: string;
  locale?: string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

type SortField = 'date' | 'description' | 'category' | 'amount' | 'type';

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categories,
  currencySymbol = '₹',
  locale = 'en-IN',
  onEdit,
  onDelete
}) => {
  const reducedMotion = useReducedMotion();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const catMap = new Map<string, Category>();
  for (const c of categories) {
    catMap.set(c.id, c);
  }

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') {
      cmp = a.date.localeCompare(b.date);
    } else if (sortField === 'amount') {
      cmp = a.amount - b.amount;
    } else if (sortField === 'description') {
      cmp = (a.description || '').localeCompare(b.description || '');
    } else if (sortField === 'type') {
      cmp = a.type.localeCompare(b.type);
    } else if (sortField === 'category') {
      const catA = catMap.get(a.categoryId)?.name || '';
      const catB = catMap.get(b.categoryId)?.name || '';
      cmp = catA.localeCompare(catB);
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)] uppercase font-semibold">
            <th
              onClick={() => handleSort('date')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
            >
              <div className="flex items-center gap-1.5">
                <span>Date</span>
                <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </th>
            <th
              onClick={() => handleSort('description')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
            >
              <div className="flex items-center gap-1.5">
                <span>Description</span>
                <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </th>
            <th
              onClick={() => handleSort('category')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
            >
              <div className="flex items-center gap-1.5">
                <span>Category</span>
                <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </th>
            <th className="py-3 px-4 select-none">Payment</th>
            <th
              onClick={() => handleSort('type')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
            >
              <div className="flex items-center gap-1.5">
                <span>Type</span>
                <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </th>
            <th
              onClick={() => handleSort('amount')}
              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>Amount</span>
                <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
              </div>
            </th>
            <th className="py-3 px-4 text-right select-none">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          <AnimatePresence initial={false}>
            {sortedTransactions.map(tx => {
              const cat = catMap.get(tx.categoryId);

              return (
                <motion.tr
                  key={tx.id}
                  layout={!reducedMotion}
                  initial={reducedMotion ? false : { opacity: 0, backgroundColor: 'var(--accent-soft)' }}
                  animate={reducedMotion ? {} : { opacity: 1, backgroundColor: 'transparent' }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, height: 0, transition: { duration: 0.2 } }
                  }
                  transition={{ duration: 0.3 }}
                  className="h-11 hover:bg-[var(--bg-subtle)] transition-colors group"
                >
                  <td className="py-2 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                    {formatDate(tx.date, 'dd MMM yyyy')}
                  </td>
                  <td className="py-2 px-4 font-medium text-[var(--text-primary)] max-w-xs truncate">
                    {tx.description || <span className="text-[var(--text-muted)] italic">No description</span>}
                    {tx.note && <span className="block text-[11px] text-[var(--text-muted)] truncate">{tx.note}</span>}
                  </td>
                  <td className="py-2 px-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{
                        backgroundColor: `${cat?.color || '#8C867A'}15`,
                        color: cat?.color || '#8C867A'
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cat?.color || '#8C867A' }}
                      />
                      {cat?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-2 px-4 uppercase text-[11px] font-medium text-[var(--text-secondary)]">
                    {tx.paymentMethod}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        tx.type === 'expense'
                          ? 'bg-[var(--danger-bg)] text-[var(--danger)]'
                          : 'bg-[var(--positive-bg)] text-[var(--success)]'
                      }`}
                    >
                      {tx.type === 'expense' ? (
                        <ArrowDownLeft className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      {tx.type === 'expense' ? 'Expense' : 'Income'}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-4 text-right font-semibold tabular-nums text-sm ${
                      tx.type === 'expense' ? 'text-[var(--text-primary)]' : 'text-[var(--success)]'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}
                    {formatCurrency(tx.amount, currencySymbol, locale, 2)}
                  </td>
                  <td className="py-2 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => onEdit(tx)}
                        aria-label="Edit transaction"
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-inset)] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(tx.id)}
                        aria-label="Delete transaction"
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-inset)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};
