# SpendLedger — Personal Monthly Transaction Tracker

SpendLedger is an offline, private Windows desktop application designed to track your daily income and expenses, monitor your monthly budget, and help you save money. All your data stays 100% on your computer.

---

## 1. Running SpendLedger (personal / single-PC setup)

This is a personal build that runs straight from this project folder — there is **no installer to
run**. Because it runs from source, any change you make to the code takes effect the next time you
open the app.

**One-time setup — create a Desktop icon:**

- Double-click **`Create Desktop Shortcut.bat`** in this folder. A **SpendLedger** icon appears on
  your Desktop, pointing at wherever this folder currently is.

**Every day:** double-click the **SpendLedger** Desktop icon (or `Launch SpendLedger.bat` in this
folder). A small window shows a ~10–30s build, then the app opens. That build step is what makes
your latest code changes appear.

**Moving or renaming this folder:** allowed any time. Move the whole folder (keep everything inside
it, including `node_modules/`), then double-click `Create Desktop Shortcut.bat` in the new location
to repoint the Desktop icon. Your data is never affected — it lives in `%APPDATA%\SpendLedger`,
separate from this folder.

> If you previously installed SpendLedger via `SpendLedger-Setup-1.0.0.exe`, uninstall it from
> **Windows Settings → Apps** so you don't have two icons running different code. Your data in
> `%APPDATA%\SpendLedger` is not touched by uninstalling.

---

## 2. Changing the App

- Edit any file under `src/`, save, then relaunch with the Desktop icon — the launcher rebuilds
  automatically, so the change is live on the next open.
- For a fast **edit-and-see-instantly** loop while you're working on something, open a terminal in
  this folder and run `npm run dev` (hot-reloads on every save). Close it when you're done.
- To produce a real standalone installer again (e.g. for another PC): `npm run build:win`, which
  writes a fresh `dist/SpendLedger-Setup-<version>.exe`.

---

## 3. Using the App

- **Dashboard**: View your current month's budget, spending progress bar, daily chart, category donut, and actionable money-saving suggestions.
- **Transactions**: Log new income or expenses, search past notes, sort by column, and edit or delete records.
- **History**: Explore 36 months of spending trends and category growth.
- **Settings**: Adjust your default monthly budget, customize category names and colors, and export your records.

---

## 4. Where Your Data Lives & How to Back It Up

- Your entire ledger is stored in a single file on your computer:
  `%APPDATA%\SpendLedger\data.json`
- **Automatic Backups**: Every time SpendLedger opens, it automatically creates a safe rolling backup in `%APPDATA%\SpendLedger\backups\`.
- **Manual Backup**: Go to **Settings → Data & Local Storage → Export Backup (.json)** to save a copy anywhere (e.g., a USB drive).
- **Exporting to Excel**: Click **Export CSV** in Settings to open your transactions in Excel or Google Sheets.

---

## 5. Moving SpendLedger to a New PC

1. On your old PC: Open **Settings** and click **Export Backup (.json)**. Save the `.json` file to a USB stick or external drive.
2. On your new PC: get SpendLedger running there — either copy this whole project folder over and
   follow section 1, or build an installer with `npm run build:win` and run it.
3. Open SpendLedger on the new PC, go to **Settings**, click **Import Backup**, and select your `.json` file.
4. All your transactions, categories, and past monthly budgets will appear immediately.

---

## 6. Troubleshooting

- **The app will not open**: Run `Launch SpendLedger.bat` directly and read the console — a red
  `BUILD FAILED` message points at the code error to fix. If the build succeeds but nothing opens,
  restart your computer and try again.
- **Data looks corrupted or unexpected**: SpendLedger automatically checks your data file on startup. If a file is ever corrupted, it automatically restores your most recent valid backup without crashing.
- **Restoring from a backup manually**: If you ever want to revert your records, go to **Settings → Import Backup** and choose any saved `.json` backup file.
