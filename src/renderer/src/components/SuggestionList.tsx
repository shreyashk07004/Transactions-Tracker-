import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Suggestion } from '../types/models';
import { suggestionStagger, suggestionCardVariants } from '../motion/variants';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';

interface SuggestionListProps {
  suggestions: Suggestion[];
  onDismiss?: (id: string) => void;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({ suggestions, onDismiss }) => {
  const reducedMotion = useReducedMotion();

  if (suggestions.length === 0) return null;

  const getToneStyle = (tone: Suggestion['tone']) => {
    switch (tone) {
      case 'critical':
        return {
          railColor: 'var(--danger)',
          bg: 'var(--danger-bg)',
          icon: <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
        };
      case 'warning':
        return {
          railColor: 'var(--warning)',
          bg: 'var(--warning-bg)',
          icon: <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
        };
      case 'positive':
        return {
          railColor: 'var(--success)',
          bg: 'var(--positive-bg)',
          icon: <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
        };
      case 'info':
      default:
        return {
          railColor: 'var(--accent)',
          bg: 'var(--bg-surface)',
          icon: <Info className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
        };
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Savings Insights & Tips</h2>
      </div>

      <motion.div
        variants={reducedMotion ? {} : suggestionStagger}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        <AnimatePresence mode="popLayout">
          {suggestions.map(s => {
            const { railColor, icon } = getToneStyle(s.tone);

            return (
              <motion.div
                key={s.id}
                layout={!reducedMotion}
                variants={reducedMotion ? {} : suggestionCardVariants}
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.18 } }
                }
                className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm flex items-start justify-between gap-3 overflow-hidden transition-all hover:border-[var(--border-strong)]"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: railColor
                }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {icon}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{s.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.body}</p>
                  </div>
                </div>

                {onDismiss && (
                  <button
                    onClick={() => onDismiss(s.id)}
                    aria-label="Dismiss suggestion"
                    className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
