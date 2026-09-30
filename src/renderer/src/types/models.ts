export type UUID = string;
export type ISODate = string;   // "YYYY-MM-DD"
export type MonthKey = string;  // "YYYY-MM"

export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'cash' | 'upi' | 'debit' | 'credit' | 'netbanking' | 'other';

export interface Transaction {
  id: UUID;
  type: TransactionType;
  amount: number;                 // positive, stored in major units (rupees)
  date: ISODate;
  categoryId: UUID;
  description: string;            // "" when unset
  paymentMethod: PaymentMethod;
  note: string;                   // "" when unset
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
}

export interface Category {
  id: UUID;
  name: string;
  color: string;                  // hex from chart palette
  discretionary: boolean;
  archived: boolean;
}

export interface Settings {
  currencySymbol: string;         // "₹"
  locale: string;                 // "en-IN"
  defaultMonthlyBudget: number;
  savingsGoalPercent: number;     // 20
  firstRunCompleted: boolean;
}

export interface AppData {
  schemaVersion: 1;
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
  monthlyBudgets: Record<MonthKey, number>;   // per-month override
  archivedMonths: MonthKey[];                 // months moved out by retention
}

export interface Suggestion {
  id: string;                    // stable rule id
  priority: number;              // 1 = highest
  title: string;                 // short, under 60 chars
  body: string;                  // one or two sentences with real numbers
  tone: 'critical' | 'warning' | 'info' | 'positive';
  potentialSaving?: number;      // rupees, when the rule can quantify it
}

export type PageId = 'dashboard' | 'transactions' | 'history' | 'settings';
