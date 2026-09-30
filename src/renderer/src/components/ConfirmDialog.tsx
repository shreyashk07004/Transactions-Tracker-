import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdropVariants, modalPanelVariants } from '../motion/variants';
import { AlertTriangle } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  onConfirm,
  onCancel
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-[4px]"
          />

          <motion.div
            variants={reducedMotion ? {} : modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-[20px] p-6 shadow-2xl z-10 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-2.5 rounded-full flex-shrink-0 ${
                  isDanger ? 'bg-[var(--danger-bg)] text-[var(--danger)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={onCancel} className="btn-secondary">
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={isDanger ? 'btn-danger' : 'btn-primary'}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
