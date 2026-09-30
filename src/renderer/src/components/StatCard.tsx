import React from 'react';
import { motion } from 'motion/react';
import { AnimatedNumber } from '../motion/AnimatedNumber';
import { statCardVariants } from '../motion/variants';

interface StatCardProps {
  label: string;
  value: number;
  currencySymbol?: string;
  locale?: string;
  decimals?: number;
  deltaText?: string;
  deltaType?: 'success' | 'danger' | 'neutral';
  isHero?: boolean;
  enableShimmer?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  currencySymbol = '₹',
  locale = 'en-IN',
  decimals = 0,
  deltaText,
  deltaType = 'neutral',
  isHero = false,
  enableShimmer = false
}) => {
  return (
    <motion.div
      variants={statCardVariants}
      className={`card-base relative overflow-hidden flex flex-col justify-between`}
      style={{ minHeight: '130px' }}
    >
      {/* Shimmer on success */}
      {enableShimmer && (
        <div
          className="absolute inset-0 pointer-events-none animate-shimmer-sweep"
          style={{
            background:
              'linear-gradient(105deg, transparent 20%, rgba(26, 158, 95, 0.18) 50%, transparent 80%)',
            zIndex: 1
          }}
          aria-hidden="true"
        />
      )}

      <div>
        <div className="text-xs uppercase font-medium tracking-wider text-[var(--text-muted)] mb-2">
          {label}
        </div>
        <div
          className={`leading-none ${
            isHero ? 'font-display text-[40px]' : 'font-semibold text-[30px] tracking-tight'
          } text-[var(--text-primary)]`}
        >
          <AnimatedNumber
            value={value}
            currencySymbol={currencySymbol}
            locale={locale}
            decimals={decimals}
          />
        </div>
      </div>

      {deltaText && (
        <div
          className={`text-xs mt-3 font-medium flex items-center gap-1 ${
            deltaType === 'success'
              ? 'text-[var(--success)]'
              : deltaType === 'danger'
              ? 'text-[var(--danger)]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          {deltaText}
        </div>
      )}
    </motion.div>
  );
};
