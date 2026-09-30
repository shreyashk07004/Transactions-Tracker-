import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface AnimatedNumberProps {
  value: number;
  currencySymbol?: string;
  locale?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  currencySymbol = '',
  locale = 'en-IN',
  decimals = 0,
  durationMs = 700,
  className = ''
}) => {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    if (reducedMotion || durationMs <= 0) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    if (startVal === endVal) return;

    const startTime = performance.now();

    // cubic-bezier(0.16, 1, 0.30, 1) approximation (fast out)
    const easeOut = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    let frameId: number;
    const update = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOut(progress);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    frameId = requestAnimationFrame(update);

    return (): void => {
      cancelAnimationFrame(frameId);
    };
  }, [value, durationMs, reducedMotion]);

  const formattedNum = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Math.abs(displayValue));

  const sign = displayValue < 0 ? '-' : '';

  return (
    <span className={`tabular-nums inline-block ${className}`} aria-live="polite">
      {sign}
      {currencySymbol}
      {formattedNum}
    </span>
  );
};
