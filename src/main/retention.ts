import fs from 'fs';
import path from 'path';
import { AppData, Transaction } from '../renderer/src/types/models';
import { subMonths, format } from 'date-fns';

export function runRetention(
  appData: AppData,
  userDataDir: string,
  referenceDate: Date = new Date()
): { updatedData: AppData; archivedCount: number } {
  // 36-month retention: most recent 36 months counted from reference month backwards
  // e.g., Sep 2026 -> keeps back to Oct 2023 (36 months total)
  const referenceMonthKey = format(referenceDate, 'yyyy-MM');
  const [refYearStr, refMonthStr] = referenceMonthKey.split('-');
  const refDate = new Date(parseInt(refYearStr, 10), parseInt(refMonthStr, 10) - 1, 1);

  const cutoffDate = subMonths(refDate, 35); // 36 months window: [cutoffDate ... refDate]
  const cutoffMonthKey = format(cutoffDate, 'yyyy-MM');

  const keptTransactions: Transaction[] = [];
  const archivedByYear = new Map<string, Transaction[]>();
  const newlyArchivedMonths = new Set<string>();

  for (const tx of appData.transactions) {
    const txMonthKey = tx.date.slice(0, 7);
    if (txMonthKey >= cutoffMonthKey) {
      keptTransactions.push(tx);
    } else {
      const year = tx.date.slice(0, 4);
      if (!archivedByYear.has(year)) {
        archivedByYear.set(year, []);
      }
      archivedByYear.get(year)!.push(tx);
      newlyArchivedMonths.add(txMonthKey);
    }
  }

  if (archivedByYear.size > 0 && userDataDir) {
    const archiveDir = path.join(userDataDir, 'archive');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    for (const [year, txs] of archivedByYear.entries()) {
      const archiveFilePath = path.join(archiveDir, `${year}.json`);
      let existingArchive: Transaction[] = [];
      if (fs.existsSync(archiveFilePath)) {
        try {
          const raw = fs.readFileSync(archiveFilePath, 'utf-8');
          existingArchive = JSON.parse(raw);
        } catch {
          existingArchive = [];
        }
      }

      // Merge and deduplicate by ID
      const txMap = new Map<string, Transaction>();
      for (const t of existingArchive) txMap.set(t.id, t);
      for (const t of txs) txMap.set(t.id, t);

      fs.writeFileSync(archiveFilePath, JSON.stringify(Array.from(txMap.values()), null, 2), 'utf-8');
    }
  }

  const allArchivedMonths = Array.from(
    new Set([...(appData.archivedMonths || []), ...Array.from(newlyArchivedMonths)])
  ).sort();

  const totalArchivedCount = appData.transactions.length - keptTransactions.length;

  return {
    updatedData: {
      ...appData,
      transactions: keptTransactions,
      archivedMonths: allArchivedMonths
    },
    archivedCount: totalArchivedCount
  };
}
