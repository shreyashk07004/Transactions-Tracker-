import fs from 'fs';
import path from 'path';
import { AppData } from '../renderer/src/types/models';
import { format } from 'date-fns';

export function createRollingBackup(userDataDir: string): void {
  const dataPath = path.join(userDataDir, 'data.json');
  if (!fs.existsSync(dataPath)) {
    return;
  }

  const backupsDir = path.join(userDataDir, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  const backupFileName = `data-${timestamp}.json`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  try {
    fs.copyFileSync(dataPath, backupFilePath);

    // Keep only the 10 most recent backups
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('data-') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)); // newest first

    if (files.length > 10) {
      const toDelete = files.slice(10);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(path.join(backupsDir, file));
        } catch {
          // ignore error deleting old backup
        }
      }
    }
  } catch (err) {
    console.error('Failed to create rolling backup:', err);
  }
}

export function getLatestValidBackup(userDataDir: string): AppData | null {
  const backupsDir = path.join(userDataDir, 'backups');
  if (!fs.existsSync(backupsDir)) return null;

  const files = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('data-') && f.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a));

  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(backupsDir, f), 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.schemaVersion === 1) {
        return parsed as AppData;
      }
    } catch {
      continue;
    }
  }
  return null;
}
