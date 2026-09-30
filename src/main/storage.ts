import fs from 'fs';
import path from 'path';
import { AppData } from '../renderer/src/types/models';
import { AppDataSchema } from '../renderer/src/lib/schema';
import { DEFAULT_CATEGORIES } from '../renderer/src/lib/categories';
import { createRollingBackup, getLatestValidBackup } from './backup';
import { runRetention } from './retention';
import { format } from 'date-fns';

export function getDefaultAppData(): AppData {
  return {
    schemaVersion: 1,
    settings: {
      currencySymbol: '₹',
      locale: 'en-IN',
      defaultMonthlyBudget: 30000,
      savingsGoalPercent: 20,
      firstRunCompleted: false
    },
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    monthlyBudgets: {},
    archivedMonths: []
  };
}

let saveTimeout: NodeJS.Timeout | null = null;
let pendingData: AppData | null = null;

export function loadAppData(userDataDir: string): { data: AppData; errorNotice?: string } {
  const dataPath = path.join(userDataDir, 'data.json');

  if (!fs.existsSync(dataPath)) {
    const initialData = getDefaultAppData();
    saveAppDataSync(userDataDir, initialData);
    return { data: initialData };
  }

  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = AppDataSchema.parse(parsed) as AppData;

    // Run retention on startup
    const { updatedData, archivedCount } = runRetention(validated, userDataDir);
    if (archivedCount > 0) {
      saveAppDataSync(userDataDir, updatedData);
      return { data: updatedData };
    }

    return { data: validated };
  } catch (err) {
    console.error('Validation or read error loading data.json:', err);
    // Corrupt file handling
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const corruptPath = path.join(userDataDir, `data.corrupt-${timestamp}.json`);
    try {
      fs.renameSync(dataPath, corruptPath);
    } catch (renameErr) {
      console.error('Failed to rename corrupt file:', renameErr);
    }

    const restoredBackup = getLatestValidBackup(userDataDir);
    if (restoredBackup) {
      saveAppDataSync(userDataDir, restoredBackup);
      return {
        data: restoredBackup,
        errorNotice: `Your data file was damaged and has been recovered from the latest valid backup. The corrupted file was archived as data.corrupt-${timestamp}.json.`
      };
    } else {
      const defaultData = getDefaultAppData();
      saveAppDataSync(userDataDir, defaultData);
      return {
        data: defaultData,
        errorNotice: `Your data file was damaged and no valid backup was found. A fresh ledger was initialized. The corrupted file was archived as data.corrupt-${timestamp}.json.`
      };
    }
  }
}

export function saveAppDataSync(userDataDir: string, data: AppData): void {
  const dataPath = path.join(userDataDir, 'data.json');
  const tmpPath = path.join(userDataDir, 'data.json.tmp');

  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const fd = fs.openSync(tmpPath, 'w');
  fs.writeFileSync(fd, jsonStr, 'utf-8');
  fs.fsyncSync(fd);
  fs.closeSync(fd);

  fs.renameSync(tmpPath, dataPath);
}

export function saveAppDataDebounced(
  userDataDir: string,
  data: AppData
): Promise<{ ok: true } | { ok: false; error: string }> {
  pendingData = data;
  return new Promise(resolve => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      try {
        if (pendingData) {
          saveAppDataSync(userDataDir, pendingData);
          pendingData = null;
        }
        resolve({ ok: true });
      } catch (err) {
        console.error('Failed to save data.json:', err);
        resolve({ ok: false, error: err instanceof Error ? err.message : 'Unknown save error' });
      }
    }, 300); // 300ms debounce
  });
}
