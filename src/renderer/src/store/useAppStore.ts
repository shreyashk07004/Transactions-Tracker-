import { create } from 'zustand';
import { AppData, Category, MonthKey, PageId, Transaction, Suggestion } from '../types/models';
import { format } from 'date-fns';
import { generateSuggestions } from '../lib/suggestions';
import { getBudgetForMonth } from '../lib/calc';
import { ToastMessage } from '../components/Toast';

interface AppStoreState {
  data: AppData | null;
  isLoading: boolean;
  initError: string | null;
  activePage: PageId;
  selectedMonth: MonthKey;
  isAddModalOpen: boolean;
  editingTransaction: Transaction | null;
  toasts: ToastMessage[];
  dismissedSuggestions: Set<string>;
  theme: 'light' | 'dark' | 'system';

  // Actions
  initializeApp: () => Promise<void>;
  setActivePage: (page: PageId) => void;
  setSelectedMonth: (month: MonthKey) => void;
  openAddModal: (tx?: Transaction) => void;
  closeAddModal: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Data operations
  saveTransaction: (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    keepOpen?: boolean
  ) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  updateCategory: (category: Category) => Promise<boolean>;
  addCategory: (name: string, color: string, discretionary: boolean) => Promise<boolean>;
  deleteCategoryWithReassign: (categoryId: string, reassignToId: string) => Promise<boolean>;
  updateSettings: (newSettings: Partial<AppData['settings']>) => Promise<boolean>;
  setMonthBudgetOverride: (monthKey: MonthKey, budget: number) => Promise<boolean>;
  importBackupData: (imported: AppData) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  data: null,
  isLoading: true,
  initError: null,
  activePage: 'dashboard',
  selectedMonth: format(new Date(), 'yyyy-MM'),
  isAddModalOpen: false,
  editingTransaction: null,
  toasts: [],
  dismissedSuggestions: new Set(),
  theme: 'system',

  initializeApp: async () => {
    try {
      set({ isLoading: true, initError: null });
      if (typeof window !== 'undefined' && window.api) {
        const appData = await window.api.loadData();
        set({ data: appData, isLoading: false });
      } else {
        console.error('window.api is unavailable — the Electron preload script did not load. Run this app via "npm run dev", not a plain browser.');
        set({
          isLoading: false,
          initError: 'Preload API unavailable. Open the app through Electron (npm run dev), not directly in a browser.'
        });
      }
    } catch (err) {
      console.error('Failed to initialize app data:', err);
      set({
        isLoading: false,
        initError: err instanceof Error ? err.message : 'Failed to load application data.'
      });
    }
  },

  setActivePage: (page: PageId) => set({ activePage: page }),
  setSelectedMonth: (month: MonthKey) => set({ selectedMonth: month }),

  openAddModal: (tx?: Transaction) => {
    set({ isAddModalOpen: true, editingTransaction: tx || null });
  },

  closeAddModal: () => {
    set({ isAddModalOpen: false, editingTransaction: null });
  },

  addToast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type };

    set(state => ({
      toasts: [...state.toasts, newToast]
    }));

    // Auto dismiss after 3.5s
    setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },

  removeToast: (id: string) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },

  dismissSuggestion: (id: string) => {
    set(state => {
      const next = new Set(state.dismissedSuggestions);
      next.add(id);
      return { dismissedSuggestions: next };
    });
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  },

  saveTransaction: async (txData, keepOpen = false) => {
    const { data, editingTransaction, addToast } = get();
    if (!data) return false;

    const nowIso = new Date().toISOString();
    let updatedTransactions = [...data.transactions];

    if (editingTransaction) {
      // Edit existing
      updatedTransactions = updatedTransactions.map(t =>
        t.id === editingTransaction.id
          ? {
              ...t,
              ...txData,
              updatedAt: nowIso
            }
          : t
      );
    } else {
      // Add new
      const newTx: Transaction = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now(),
        ...txData,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      updatedTransactions.push(newTx);
    }

    const nextData: AppData = {
      ...data,
      transactions: updatedTransactions
    };

    set({ data: nextData });
    if (!keepOpen) {
      set({ isAddModalOpen: false, editingTransaction: null });
    }

    addToast(editingTransaction ? 'Transaction updated' : 'Transaction added', 'success');

    if (window.api) {
      await window.api.saveData(nextData);
    }
    return true;
  },

  deleteTransaction: async (id: string) => {
    const { data, addToast } = get();
    if (!data) return false;

    const nextData: AppData = {
      ...data,
      transactions: data.transactions.filter(t => t.id !== id)
    };

    set({ data: nextData });
    addToast('Transaction deleted', 'info');

    if (window.api) {
      await window.api.saveData(nextData);
    }
    return true;
  },

  updateCategory: async (cat: Category) => {
    const { data, addToast } = get();
    if (!data) return false;

    const nextCategories = data.categories.map(c => (c.id === cat.id ? cat : c));
    const nextData: AppData = { ...data, categories: nextCategories };

    set({ data: nextData });
    addToast('Category updated', 'success');

    if (window.api) {
      await window.api.saveData(nextData);
    }
    return true;
  },

  addCategory: async (name: string, color: string, discretionary: boolean) => {
    const { data, addToast } = get();
    if (!data) return false;

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: name.trim(),
      color,
      discretionary,
      archived: false
    };

    const nextData: AppData = {
      ...data,
      categories: [...data.categories, newCat]
    };

    set({ data: nextData });
    addToast(`Category "${newCat.name}" created`, 'success');

    if (window.api) {
      await window.api.saveData(nextData);
    }
    return true;
  },

  deleteCategoryWithReassign: async (categoryId: string, reassignToId: string) => {
    const { data, addToast } = get();
    if (!data) return false;

    const remappedTx = data.transactions.map(t =>
      t.categoryId === categoryId ? { ...t, categoryId: reassignToId } : t
    );

    const filteredCats = data.categories.filter(c => c.id !== categoryId);
    const nextData: AppData = {
      ...data,
      categories: filteredCats,
      transactions: remappedTx
    };

    set({ data: nextData });
    addToast('Category removed and transactions reassigned', 'success');

    if (window.api) {
      await window.api.saveData(nextData);
    }
    return true;
  },

  updateSettings: async (newSettings: Partial<AppData['settings']>) => {
    const { data, addToast } = get();
    if (!data) return false;

    const nextData: AppData = {
      ...data,
      settings: {
        ...data.settings,
        ...newSettings
      }
    };

    set({ data: nextData });
    addToast('Settings saved', 'success');

    if (window.api) {
      await window.api.saveData(nextData);
    }
    return true;
  },

  setMonthBudgetOverride: async (monthKey: MonthKey, budget: number) => {
    const { data, addToast } = get();
    if (!data) return false;

    const nextBudgets = { ...data.monthlyBudgets, [monthKey]: budget };
    const nextData: AppData = {
      ...data,
      monthlyBudgets: nextBudgets
    };

    set({ data: nextData });
    addToast(`Budget updated for ${monthKey}`, 'success');

    if (window.api) {
      await window.api.saveData(nextData);
    }
    return true;
  },

  importBackupData: (imported: AppData) => {
    set({ data: imported });
    get().addToast('Backup imported successfully', 'success');
  }
}));
