import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toastVariants } from '../motion/variants';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.slice(-3).map(toast => {
          let Icon = CheckCircle2;
          let colorClass = 'text-[var(--success)]';
          let borderClass = 'border-[var(--success)]';

          if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'text-[var(--danger)]';
            borderClass = 'border-[var(--danger)]';
          } else if (toast.type === 'info') {
            Icon = Info;
            colorClass = 'text-[var(--accent)]';
            borderClass = 'border-[var(--accent)]';
          }

          return (
            <motion.div
              key={toast.id}
              variants={reducedMotion ? {} : toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`pointer-events-auto bg-[var(--bg-surface)] border ${borderClass} rounded-xl p-3.5 shadow-xl flex items-center justify-between gap-3`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 flex-shrink-0 ${colorClass}`} />
                <span className="text-xs font-medium text-[var(--text-primary)]">{toast.message}</span>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Close"
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
