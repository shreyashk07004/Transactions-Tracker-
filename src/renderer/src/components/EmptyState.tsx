import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  hint?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No transactions yet',
  description = 'Start tracking your spending by recording your first transaction for this month.',
  actionText = 'Add your first transaction',
  onAction,
  hint
}) => {
  return (
    <div className="card-static flex flex-col items-center justify-center text-center p-12 my-6">
      {/* Centred inline SVG illustration that drifts 6px vertically on a 6s loop */}
      <div className="w-24 h-24 mb-6 animate-empty-drift text-[var(--accent)]">
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="16" y="24" width="64" height="48" rx="8" fill="var(--bg-subtle)" stroke="currentColor" strokeWidth="2.5" />
          <path d="M16 38H80" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          <rect x="26" y="48" width="20" height="4" rx="2" fill="var(--accent)" fillOpacity="0.4" />
          <rect x="26" y="56" width="32" height="4" rx="2" fill="var(--text-muted)" fillOpacity="0.3" />
          <circle cx="68" cy="54" r="6" stroke="currentColor" strokeWidth="2" fill="var(--bg-surface)" />
          <path d="M68 51V57M65 54H71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {onAction && (
        <button onClick={onAction} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}

      {hint && (
        <div className="mt-6 pt-6 border-t border-[var(--border)] w-full max-w-sm text-left text-xs text-[var(--text-muted)] leading-relaxed">
          {hint}
        </div>
      )}
    </div>
  );
};
