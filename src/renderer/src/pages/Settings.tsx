import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CHART_PALETTE } from '../lib/categories';
import { Category, MonthKey } from '../types/models';
import { formatMonthYear, formatCurrency } from '../lib/format';
import {
  Download,
  Upload,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  FileSpreadsheet,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { format } from 'date-fns';

export const Settings: React.FC = () => {
  const {
    data,
    updateSettings,
    addCategory,
    updateCategory,
    deleteCategoryWithReassign,
    setMonthBudgetOverride,
    importBackupData,
    addToast,
    theme,
    setTheme
  } = useAppStore();

  const [appVersion, setAppVersion] = useState<string>('1.0.0');

  // Local form state
  const [defaultBudget, setDefaultBudget] = useState<number>(30000);
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [locale, setLocale] = useState<string>('en-IN');
  const [savingsGoal, setSavingsGoal] = useState<number>(20);

  // Month override form state
  const [overrideMonth, setOverrideMonth] = useState<MonthKey>(format(new Date(), 'yyyy-MM'));
  const [overrideBudget, setOverrideBudget] = useState<string>('');

  // Category management state
  const [isAddCatModal, setIsAddCatModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>(CHART_PALETTE[0]);
  const [newCatDiscretionary, setNewCatDiscretionary] = useState<boolean>(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Deletion reassign modal state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [reassignTxCount, setReassignTxCount] = useState<number>(0);

  // Import warning confirm state
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setDefaultBudget(data.settings.defaultMonthlyBudget);
      setCurrencySymbol(data.settings.currencySymbol);
      setLocale(data.settings.locale);
      setSavingsGoal(data.settings.savingsGoalPercent);
    }

    if (window.api) {
      window.api.getAppVersion().then(v => {
        if (v) setAppVersion(v);
      });
    }
  }, [data]);

  if (!data) return null;

  const handleSaveGeneralSettings = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await updateSettings({
      defaultMonthlyBudget: Number(defaultBudget) || 0,
      currencySymbol,
      locale,
      savingsGoalPercent: Number(savingsGoal) || 20
    });
  };

  const handleSetMonthOverride = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const num = parseFloat(overrideBudget);
    if (!isNaN(num) && num >= 0 && overrideMonth) {
      await setMonthBudgetOverride(overrideMonth, num);
      setOverrideBudget('');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (newCatName.trim()) {
      await addCategory(newCatName.trim(), newCatColor, newCatDiscretionary);
      setNewCatName('');
      setIsAddCatModal(false);
    }
  };

  const handleUpdateCategorySubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (editingCategory && editingCategory.name.trim()) {
      await updateCategory(editingCategory);
      setEditingCategory(null);
    }
  };

  const handleDeleteCategoryClick = (cat: Category): void => {
    const matchingTx = data.transactions.filter(t => t.categoryId === cat.id);
    setDeletingCategory(cat);
    setReassignTxCount(matchingTx.length);

    const otherCats = data.categories.filter(c => c.id !== cat.id);
    if (otherCats.length > 0) {
      setReassignTargetId(otherCats[0].id);
    }
  };

  const handleConfirmCategoryDeletion = async (): Promise<void> => {
    if (deletingCategory && reassignTargetId) {
      await deleteCategoryWithReassign(deletingCategory.id, reassignTargetId);
      setDeletingCategory(null);
    }
  };

  const handleExportBackup = async (): Promise<void> => {
    if (window.api) {
      const res = await window.api.exportBackup();
      if (res.ok) {
        addToast(`Backup exported to ${res.path}`, 'success');
      }
    }
  };

  const handleExportCsv = async (): Promise<void> => {
    if (window.api) {
      const res = await window.api.exportCsv();
      if (res.ok) {
        addToast(`CSV exported to ${res.path}`, 'success');
      }
    }
  };

  const handleImportBackup = async (): Promise<void> => {
    setIsImportConfirmOpen(false);
    if (window.api) {
      const res = await window.api.importBackup();
      if (res.ok && res.data) {
        importBackupData(res.data);
      } else if (res.error) {
        addToast(`Import failed: ${res.error}`, 'error');
      }
    }
  };

  const handleOpenFolder = (): void => {
    if (window.api) {
      window.api.openDataFolder();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Manage monthly budget defaults, spending categories, currency, and local data backups
        </p>
      </div>

      {/* 1. Appearance / Theme */}
      <div className="card-static space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Appearance</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              theme === 'light'
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light Theme</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark Theme</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              theme === 'system'
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>System Default</span>
          </button>
        </div>
      </div>

      {/* 2. Budget and Financial Preferences */}
      <div className="card-static space-y-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Financial & Budget Preferences
        </h2>

        <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                Default Monthly Budget ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={defaultBudget}
                onChange={e => setDefaultBudget(Number(e.target.value))}
                className="input-base w-full tabular-nums text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Used for every month unless you set a per-month override below.
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                Target Savings Goal (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={savingsGoal}
                onChange={e => setSavingsGoal(Number(e.target.value))}
                className="input-base w-full tabular-nums text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Only drives the &ldquo;savings rate below goal&rdquo; tip on the Dashboard.
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={e => setCurrencySymbol(e.target.value)}
                className="input-base w-full text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Shown next to amounts. Number grouping still follows the locale below.
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1.5">
                Locale Format
              </label>
              <input
                type="text"
                value={locale}
                onChange={e => setLocale(e.target.value)}
                placeholder="en-IN"
                className="input-base w-full text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Language-region code for number grouping, e.g. en-IN, en-US, de-DE.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary">
              <Check className="w-4 h-4" />
              <span>Save Financial Settings</span>
            </button>
          </div>
        </form>

        {/* Specific Month Budget Override */}
        <div className="pt-6 border-t border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Override Budget for Specific Month
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Set custom budgets for past or future months without affecting the global default.
          </p>

          <form onSubmit={handleSetMonthOverride} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1">Month</label>
              <input
                type="month"
                value={overrideMonth}
                onChange={e => setOverrideMonth(e.target.value)}
                className="input-base text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1">Budget ({currencySymbol})</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={overrideBudget}
                onChange={e => setOverrideBudget(e.target.value)}
                className="input-base text-xs w-36"
              />
            </div>

            <button type="submit" className="btn-secondary text-xs h-9">
              Apply Override
            </button>
          </form>

          {/* List of active overrides */}
          {data.monthlyBudgets && Object.keys(data.monthlyBudgets).length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                Active Month Overrides:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.monthlyBudgets).map(([mKey, bVal]) => (
                  <span
                    key={mKey}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg text-xs"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatMonthYear(mKey)}:
                    </span>
                    <span className="tabular-nums text-[var(--accent)] font-medium">
                      {formatCurrency(bVal, currencySymbol, locale)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Category Management */}
      <div className="card-static space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Categories</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Customize spending categories and colors. &ldquo;Discretionary&rdquo; means
              non-essential (wants, not needs) — savings tips use this flag to spot where to cut back.
            </p>
          </div>
          <button
            onClick={() => setIsAddCatModal(true)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.categories.map(cat => (
            <div
              key={cat.id}
              className="p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl flex items-center justify-between gap-2 shadow-sm hover:border-[var(--border-strong)] transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{cat.name}</p>
                  <p
                    className="text-[10px] text-[var(--text-muted)]"
                    title={
                      cat.discretionary
                        ? 'Non-essential spending (wants). Counts toward the discretionary savings tips.'
                        : 'Essential spending (needs).'
                    }
                  >
                    {cat.discretionary ? 'Discretionary' : 'Essential'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingCategory({ ...cat })}
                  aria-label="Edit category"
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-subtle)]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {data.categories.length > 1 && (
                  <button
                    onClick={() => handleDeleteCategoryClick(cat)}
                    aria-label="Delete category"
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-subtle)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Data Management: Export, Import, CSV, File Folder */}
      <div className="card-static space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Data & Local Storage</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Your data is stored completely on your PC. Create backups or export records anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={handleExportBackup} className="btn-secondary h-12 flex items-center justify-center gap-2">
            <Download className="w-4 h-4 text-[var(--accent)]" />
            <span>Export Backup (.json)</span>
          </button>

          <button onClick={handleExportCsv} className="btn-secondary h-12 flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[var(--success)]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsImportConfirmOpen(true)}
            className="btn-secondary h-12 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4 text-[var(--warning)]" />
            <span>Import Backup</span>
          </button>

          <button onClick={handleOpenFolder} className="btn-secondary h-12 flex items-center justify-center gap-2">
            <FolderOpen className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Open Data Folder</span>
          </button>
        </div>
      </div>

      {/* 5. About */}
      <div className="card-static flex items-start gap-3.5 p-4">
        <ShieldCheck className="w-6 h-6 text-[var(--accent)] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            SpendLedger Desktop v{appVersion}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            All transaction and budget records are stored privately on this computer inside your local
            app data directory. SpendLedger has no cloud connection, no analytics, and zero tracking.
          </p>
        </div>
      </div>

      {/* Add Category Dialog */}
      {isAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[4px]">
          <div className="card-static w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add New Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Pet Care"
                  className="input-base w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {CHART_PALETTE.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newCatColor === c ? 'scale-125 border-[var(--text-primary)]' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="discretionaryCheck"
                  checked={newCatDiscretionary}
                  onChange={e => setNewCatDiscretionary(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)]"
                />
                <label htmlFor="discretionaryCheck" className="text-xs text-[var(--text-primary)]">
                  Discretionary (Non-essential)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button type="button" onClick={() => setIsAddCatModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Dialog */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[4px]">
          <div className="card-static w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Edit Category</h3>
            <form onSubmit={handleUpdateCategorySubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={e =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="input-base w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {CHART_PALETTE.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setEditingCategory({ ...editingCategory, color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        editingCategory.color === c
                          ? 'scale-125 border-[var(--text-primary)]'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editDiscretionary"
                  checked={editingCategory.discretionary}
                  onChange={e =>
                    setEditingCategory({
                      ...editingCategory,
                      discretionary: e.target.checked
                    })
                  }
                  className="rounded border-[var(--border)] text-[var(--accent)]"
                />
                <label htmlFor="editDiscretionary" className="text-xs text-[var(--text-primary)]">
                  Discretionary (Non-essential)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button type="button" onClick={() => setEditingCategory(null)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category with Reassignment Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[4px]">
          <div className="card-static w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Remove Category "{deletingCategory.name}"
            </h3>

            {reassignTxCount > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  There are{' '}
                  <strong className="text-[var(--danger)] font-semibold">{reassignTxCount}</strong>{' '}
                  transactions currently filed under "{deletingCategory.name}". Choose a replacement
                  category to reassign them before deleting:
                </p>

                <div>
                  <label className="block text-xs uppercase font-medium text-[var(--text-muted)] mb-1">
                    Reassign To
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={e => setReassignTargetId(e.target.value)}
                    className="input-base w-full bg-[var(--bg-surface)] text-xs"
                  >
                    {data.categories
                      .filter(c => c.id !== deletingCategory.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                Are you sure you want to delete this category? There are no transactions under it.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button onClick={() => setDeletingCategory(null)} className="btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleConfirmCategoryDeletion} className="btn-danger text-xs">
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Backup Warning Dialog */}
      <ConfirmDialog
        isOpen={isImportConfirmOpen}
        title="Import Backup File"
        message="Importing a backup will replace your current transactions, categories, and settings. Ensure you have saved your current data if needed."
        confirmText="Choose Backup File"
        isDanger={true}
        onConfirm={handleImportBackup}
        onCancel={() => setIsImportConfirmOpen(false)}
      />
    </div>
  );
};
