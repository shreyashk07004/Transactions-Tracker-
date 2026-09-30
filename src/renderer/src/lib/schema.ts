import { z } from 'zod';

export const PaymentMethodSchema = z.enum([
  'cash',
  'upi',
  'debit',
  'credit',
  'netbanking',
  'other'
]);

export const TransactionTypeSchema = z.enum(['expense', 'income']);

export const TransactionSchema = z.object({
  id: z.string().min(1),
  type: TransactionTypeSchema,
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  description: z.string().max(80, { message: 'Description cannot exceed 80 characters' }).default(''),
  paymentMethod: PaymentMethodSchema,
  note: z.string().max(200, { message: 'Note cannot exceed 200 characters' }).default(''),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, { message: 'Category name is required' }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Valid hex color required' }),
  discretionary: z.boolean(),
  archived: z.boolean().default(false)
});

export const SettingsSchema = z.object({
  currencySymbol: z.string().default('₹'),
  locale: z.string().default('en-IN'),
  defaultMonthlyBudget: z.number().nonnegative().default(30000),
  savingsGoalPercent: z.number().min(0).max(100).default(20),
  firstRunCompleted: z.boolean().default(false)
});

export const AppDataSchema = z.object({
  schemaVersion: z.literal(1),
  settings: SettingsSchema,
  categories: z.array(CategorySchema),
  transactions: z.array(TransactionSchema),
  monthlyBudgets: z.record(z.string(), z.number()),
  archivedMonths: z.array(z.string())
});

export const TransactionInputSchema = z.object({
  type: TransactionTypeSchema,
  amount: z.number({ invalid_type_error: 'Amount is required' })
    .positive({ message: 'Amount must be greater than 0' })
    .refine(val => {
      const decimals = val.toString().split('.')[1];
      return !decimals || decimals.length <= 2;
    }, { message: 'Maximum 2 decimal places allowed' }),
  date: z.string().min(1, { message: 'Date is required' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  description: z.string().max(80, { message: 'Description cannot exceed 80 characters' }).optional().default(''),
  paymentMethod: PaymentMethodSchema,
  note: z.string().max(200, { message: 'Note cannot exceed 200 characters' }).optional().default('')
});
