import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MonthPicker } from '../components/MonthPicker';
import { TransactionTable } from '../components/TransactionTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatMonthYear } from '../lib/format';
import { Plus, Search, Filter } from 'lucide-react';
import { Transaction } from '../types/models';

export const Transactions: React.FC = () => {
  const {
    data,
    selectedMonth,
    setSelectedMonth,
    openAddModal,
    deleteTransaction
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  if (!data) return null;

  const { settings, categories, transactions } = data;
  const currencySymbol = settings.currencySymbol || '₹';
  const locale = settings.locale || 'en-IN';

  // Filter transactions by selected month, search query, and category
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Month match
      if (!t.date.startsWith(selectedMonth)) return false;

      // Category match
      if (filterCategoryId !== 'all' && t.categoryId !== filterCategoryId) return false;

      // Search match (description and note)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const noteMatch = (t.note || '').toLowerCase().includes(query);
        if (!descMatch && !noteMatch) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, filterCategoryId, searchQuery]);

  // Totals for filtered view
  const { filteredExpense, filteredIncome, filteredCount } = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'expense') expense += t.amount;
      if (t.type === 'income') income += t.amount;
    }
    return {
      filteredExpense: expense,
      filteredIncome: income,
      filteredCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const handleDeleteConfirm = async (): Promise<void> => {
    if (deletingTxId) {
      await deleteTransaction(deletingTxId);
      setDeletingTxId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transactions</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Managing entries for {formatMonthYear(selectedMonth)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <MonthPicker currentMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          <button onClick={() => openAddModal()} className="btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-static p-4 flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description or note..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-base w-full pl-9 text-xs"
          />
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          <select
            value={filterCategoryId}
            onChange={e => setFilterCategoryId(e.target.value)}
            className="input-base w-full md:w-48 bg-[var(--bg-surface)] text-xs"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table or Empty State */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          title="No transactions match your criteria"
          description={
            searchQuery || filterCategoryId !== 'all'
              ? 'Try clearing your filters or search keyword.'
              : `No transactions recorded for ${formatMonthYear(selectedMonth)}.`
          }
          actionText="Add transaction"
          onAction={() => openAddModal()}
        />
      ) : (
        <div className="space-y-4">
          <TransactionTable
            transactions={filteredTransactions}
            categories={categories}
            currencySymbol={currencySymbol}
            locale={locale}
            onEdit={(tx: Transaction) => openAddModal(tx)}
            onDelete={(id: string) => setDeletingTxId(id)}
          />

          {/* Filter Summary Footer Row */}
          <div className="card-static p-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-secondary)] gap-2">
            <span>
              Showing <strong className="text-[var(--text-primary)] font-semibold">{filteredCount}</strong> entries
            </span>
            <div className="flex items-center gap-4">
              {filteredIncome > 0 && (
                <span className="text-[var(--success)] font-medium">
                  Total Income: {formatCurrency(filteredIncome, currencySymbol, locale, 2)}
                </span>
              )}
              <span className="text-[var(--text-primary)] font-semibold">
                Total Expenses: {formatCurrency(filteredExpense, currencySymbol, locale, 2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingTxId !== null}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTxId(null)}
      />
    </div>
  );
};
