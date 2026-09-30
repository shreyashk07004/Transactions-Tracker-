import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { AppData, Transaction } from '../renderer/src/types/models';
import { AppDataSchema } from '../renderer/src/lib/schema';
import { loadAppData, saveAppDataDebounced, saveAppDataSync } from './storage';
import { format } from 'date-fns';

export function registerIpcHandlers(userDataDir: string, mainWindow: BrowserWindow): void {
  ipcMain.handle('storage:load', async () => {
    const { data } = loadAppData(userDataDir);
    return data;
  });

  ipcMain.handle('storage:save', async (_event, data: AppData) => {
    return await saveAppDataDebounced(userDataDir, data);
  });

  ipcMain.handle('storage:openFolder', async () => {
    shell.openPath(userDataDir);
  });

  ipcMain.handle('app:getVersion', async () => {
    return app.getVersion();
  });

  ipcMain.handle('backup:export', async () => {
    const defaultName = `spendledger-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export SpendLedger Backup',
      defaultPath: defaultName,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (canceled || !filePath) {
      return { ok: false };
    }

    try {
      const dataPath = path.join(userDataDir, 'data.json');
      if (fs.existsSync(dataPath)) {
        fs.copyFileSync(dataPath, filePath);
      } else {
        const { data } = loadAppData(userDataDir);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      }
      return { ok: true, path: filePath };
    } catch (err) {
      console.error('Export backup failed:', err);
      return { ok: false };
    }
  });

  ipcMain.handle('backup:exportCsv', async () => {
    const defaultName = `spendledger-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Transactions as CSV',
      defaultPath: defaultName,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (canceled || !filePath) {
      return { ok: false };
    }

    try {
      const { data } = loadAppData(userDataDir);
      const catMap = new Map<string, string>();
      for (const c of data.categories) {
        catMap.set(c.id, c.name);
      }

      const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Payment Method', 'Note'];
      const rows = data.transactions.map(t => {
        const catName = catMap.get(t.categoryId) || 'Unknown';
        const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
        return [
          t.date,
          t.type,
          t.amount.toString(),
          escapeCsv(catName),
          escapeCsv(t.description),
          t.paymentMethod,
          escapeCsv(t.note)
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      fs.writeFileSync(filePath, csvContent, 'utf-8');
      return { ok: true, path: filePath };
    } catch (err) {
      console.error('Export CSV failed:', err);
      return { ok: false };
    }
  });

  ipcMain.handle('backup:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import SpendLedger Backup',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { ok: false };
    }

    try {
      const raw = fs.readFileSync(filePaths[0], 'utf-8');
      const parsed = JSON.parse(raw);
      const validated = AppDataSchema.parse(parsed) as AppData;

      // Save imported data
      saveAppDataSync(userDataDir, validated);
      return { ok: true, data: validated };
    } catch (err) {
      console.error('Import backup failed:', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Invalid backup file format'
      };
    }
  });
}
