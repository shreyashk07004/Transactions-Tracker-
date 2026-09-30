import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageId } from '../types/models';
import { LayoutDashboard, Receipt, History as HistoryIcon, Settings, Plus } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';

interface AppShellProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  onAddTransaction: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activePage,
  onPageChange,
  onAddTransaction,
  children
}) => {
  const reducedMotion = useReducedMotion();

  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'This month at a glance'
    },
    {
      id: 'transactions' as PageId,
      label: 'Transactions',
      icon: Receipt,
      desc: 'Every entry for the selected month'
    },
    {
      id: 'history' as PageId,
      label: 'History',
      icon: HistoryIcon,
      desc: 'Trends across up to 36 months'
    },
    {
      id: 'settings' as PageId,
      label: 'Settings',
      icon: Settings,
      desc: 'Budget, categories, currency, backups'
    }
  ];

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* 220px Fixed Sidebar */}
      <aside className="w-[220px] h-full flex-shrink-0 bg-[var(--bg-subtle)] border-r border-[var(--border)] flex flex-col justify-between p-4 z-20">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white shadow-sm font-semibold">
              ₹
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight leading-tight text-[var(--text-primary)]">
                SpendLedger
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">Personal Tracker</p>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onAddTransaction}
            className="w-full btn-primary mb-6 shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  title={item.desc}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative w-full h-[38px] flex items-center gap-3 px-3 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {/* Signature gradient top marker */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavMarker"
                      className="absolute top-0 left-2 right-2 h-[2px] rounded-full"
                      style={{ background: 'var(--grad-accent)' }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 240, damping: 28 }
                      }
                    />
                  )}
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="pt-4 border-t border-[var(--border)] px-3 text-[11px] text-[var(--text-muted)]">
          <p>100% Offline & Local</p>
          <p className="text-[10px] opacity-70 mt-0.5">Single User Desktop</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto relative z-10">
        <div className="max-w-[1240px] mx-auto p-7">{children}</div>
      </main>
    </div>
  );
};
