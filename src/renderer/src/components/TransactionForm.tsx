import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdropVariants, modalPanelVariants } from '../motion/variants';
import { Category, PaymentMethod, Transaction, TransactionType } from '../types/models';
import { TransactionInputSchema } from '../lib/schema';
import { format } from 'date-fns';
import { X, Check } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: Transaction | null;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, keepOpen: boolean) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  categories,
  initialData,
  onSave
}) => {
  const reducedMotion = useReducedMotion();
  const amountInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableCategories = categories.filter(c => !c.archived);

  // Initialize or reset fields
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmount(initialData.amount.toString());
        setDate(initialData.date);
        setCategoryId(initialData.categoryId);
        setDescription(initialData.description || '');
        setPaymentMethod(initialData.paymentMethod);
        setNote(initialData.note || '');
      } else {
        setType('expense');
        setAmount('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setCategoryId(availableCategories.length > 0 ? availableCategories[0].id : '');
        setDescription('');
        setPaymentMethod('upi');
        setNote('');
      }
      setErrors({});

      // Auto focus on amount after animation starts
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialData]);

  // Keyboard shortcut handler (Enter to submit, Esc to close)
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = (e?: React.FormEvent, keepOpen = false): void => {
    if (e) e.preventDefault();
    setErrors({});

    const numAmount = parseFloat(amount);
    const validation = TransactionInputSchema.safeParse({
      type,
      amount: isNaN(numAmount) ? undefined : numAmount,
      date,
      categoryId,
      description,
      paymentMethod,
      note
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    onSave(
      {
        type,
        amount: numAmount,
        date,
        categoryId,
        description: description.trim(),
        paymentMethod,
        note: note.trim()
      },
      keepOpen
    );

    if (keepOpen) {
      setAmount('');
      setDescription('');
      setNote('');
      setErrors({});
      amountInputRef.current?.focus();
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop with 4px blur */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[4px]"
          />

          {/* Modal Panel (520px wide, 20px radius, --shadow-modal) */}
          <motion.div
            variants={reducedMotion ? {} : modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-[520px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[20px] p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {initialData ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={e => handleSubmit(e, false)} className="space-y-4">
              {/* 1. Type toggle: Expense / Income */}
              <div>
                <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-subtle)] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      type === 'expense'
                        ? 'bg-[var(--bg-surface)] text-[var(--danger)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      type === 'income'
                        ? 'bg-[var(--bg-surface)] text-[var(--success)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* 2. Amount */}
              <div>
                <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                  Amount (₹) *
                </label>
                <input
                  ref={amountInputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={`input-base w-full tabular-nums text-base font-medium ${
                    errors.amount ? 'border-[var(--danger)]' : ''
                  }`}
                />
                {errors.amount && (
                  <p className="text-xs text-[var(--danger)] mt-1 font-medium">{errors.amount}</p>
                )}
              </div>

              {/* 3. Date */}
              <div>
                <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={`input-base w-full ${errors.date ? 'border-[var(--danger)]' : ''}`}
                />
                {errors.date && (
                  <p className="text-xs text-[var(--danger)] mt-1 font-medium">{errors.date}</p>
                )}
              </div>

              {/* 4. Category */}
              <div>
                <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className={`input-base w-full bg-[var(--bg-surface)] ${
                    errors.categoryId ? 'border-[var(--danger)]' : ''
                  }`}
                >
                  {availableCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.discretionary ? '(Discretionary)' : ''}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-[var(--danger)] mt-1 font-medium">{errors.categoryId}</p>
                )}
              </div>

              {/* 5. Description */}
              <div>
                <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                  Description (max 80 chars)
                </label>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Weekly grocery shopping"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-base w-full"
                />
              </div>

              {/* 6. Payment Method */}
              <div>
                <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="input-base w-full bg-[var(--bg-surface)]"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="debit">Debit card</option>
                  <option value="credit">Credit card</option>
                  <option value="netbanking">Net banking</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* 7. Note */}
              <div>
                <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                  Note (max 200 chars)
                </label>
                <textarea
                  maxLength={200}
                  rows={2}
                  placeholder="Optional extra details..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="input-base w-full py-2 h-auto resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
                <span className="text-[11px] text-[var(--text-muted)] hidden sm:block">
                  Enter to save · Esc to close
                </span>
                <div className="flex items-center justify-end gap-3">
                  <button type="button" onClick={onClose} className="btn-secondary">
                    Cancel
                  </button>

                  {!initialData && (
                    <button
                      type="button"
                      onClick={() => handleSubmit(undefined, true)}
                      className="btn-secondary"
                    >
                      Save & Add Another
                    </button>
                  )}

                  <button type="submit" className="btn-primary">
                    <Check className="w-4 h-4" />
                    <span>{initialData ? 'Update' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
