import { Category } from '../types/models';

export const CHART_PALETTE = [
  '#4F46E5', '#1A9E5F', '#C8811A', '#7C3AED', '#DB2777',
  '#0E9AA7', '#E2643A', '#5B7CFA', '#7C7566', '#9A6B1F',
  '#0E7490', '#A21C68'
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food & Groceries', color: '#4F46E5', discretionary: false, archived: false },
  { id: 'cat-dining', name: 'Dining Out', color: '#1A9E5F', discretionary: true, archived: false },
  { id: 'cat-transport', name: 'Transport', color: '#C8811A', discretionary: false, archived: false },
  { id: 'cat-rent', name: 'Rent & Utilities', color: '#7C3AED', discretionary: false, archived: false },
  { id: 'cat-shopping', name: 'Shopping', color: '#DB2777', discretionary: true, archived: false },
  { id: 'cat-entertainment', name: 'Entertainment', color: '#0E9AA7', discretionary: true, archived: false },
  { id: 'cat-health', name: 'Health', color: '#E2643A', discretionary: false, archived: false },
  { id: 'cat-subscriptions', name: 'Subscriptions', color: '#5B7CFA', discretionary: true, archived: false },
  { id: 'cat-education', name: 'Education', color: '#7C7566', discretionary: false, archived: false },
  { id: 'cat-personal', name: 'Personal Care', color: '#9A6B1F', discretionary: true, archived: false },
  { id: 'cat-gifts', name: 'Gifts & Donations', color: '#0E7490', discretionary: false, archived: false },
  { id: 'cat-other', name: 'Other', color: '#A21C68', discretionary: false, archived: false }
];
