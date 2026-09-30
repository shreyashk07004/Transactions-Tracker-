import { format, parseISO } from 'date-fns';

export function formatCurrency(
  amount: number,
  currencySymbol = '₹',
  locale = 'en-IN',
  maximumFractionDigits = 0
): string {
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: maximumFractionDigits,
      maximumFractionDigits: maximumFractionDigits
    }).format(Math.abs(amount));

    const sign = amount < 0 ? '-' : '';
    return `${sign}${currencySymbol}${formatted}`;
  } catch {
    const formatted = Math.abs(amount).toFixed(maximumFractionDigits);
    const sign = amount < 0 ? '-' : '';
    return `${sign}${currencySymbol}${formatted}`;
  }
}

export function formatDate(isoDate: string, formatStr = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(isoDate), formatStr);
  } catch {
    return isoDate;
  }
}

export function formatMonthYear(monthKey: string): string {
  try {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return format(date, 'MMMM yyyy');
  } catch {
    return monthKey;
  }
}
