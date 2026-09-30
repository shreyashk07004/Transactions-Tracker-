# PROMPT FOR GOOGLE ANTIGRAVITY

Copy everything below the line into Antigravity as your build request.

---

## 0. ROLE AND MISSION

You are a senior desktop application engineer. Build a complete, working, offline-first Windows desktop application called **SpendLedger** — a personal monthly transaction tracker for a single user on one PC.

The user is **non-technical**. The final result must be installable by double-clicking one file, and must create a desktop icon. The user will never open a terminal after installation.

Build the entire project from scratch in one repository. Produce working code, not placeholders, not `TODO` comments, not stub functions. Every feature listed in this document must actually run.

---

## 1. HARD RULES — READ BEFORE WRITING ANY CODE

These rules exist to stop you from inventing things. Follow them literally.

1. **Do not invent package versions.** For every dependency, run `npm view <package> version` (or `npm view <package> dist-tags`) in the terminal and use the real latest stable version inside the major version I pin in Section 3. If a command fails, tell me — do not guess a number.
2. **Do not invent APIs.** If you are unsure whether a function or option exists in a library, check the installed package's TypeScript types in `node_modules` before using it.
3. **No cloud, no network, no telemetry.** The app must function with the internet fully disconnected. No API calls, no CDN links, no fonts loaded over HTTP, no analytics, no crash reporting, no auto-update server. Bundle every asset locally.
4. **No accounts, no login, no passwords, no encryption keys.** Single user, single machine.
5. **No AI or LLM calls anywhere in the app.** The "savings suggestions" feature is a deterministic rules engine written in plain TypeScript, specified exactly in Section 8.
6. **Keep it micro, but make it beautiful.** Four screens total. Do not add *features* I did not ask for. Polish is different from features: the visual identity and the animation inventory in Section 10 are required work, not optional extras. No budgeting envelopes, no bank sync, no receipt OCR, no multi-user, no tags system beyond what is specified, no plugin system.
7. **Never use native Node modules that require compilation** (this rules out `better-sqlite3`, `sqlite3`, `node-gyp` builds). Storage is a plain JSON file, specified in Section 6. This is a deliberate choice to avoid Windows build-toolchain failures.
8. **Type-safe throughout.** TypeScript strict mode on. No `any`. The build must pass `tsc --noEmit` with zero errors.
9. **Follow `DESIGN.md` exactly** (Section 10). Create that file first, before writing any UI code, then implement against it. Do not deviate from its colours, spacing, or typography.
10. **Work in this order** and show me the result at each checkpoint: scaffold → design tokens and fonts → data layer → calculations + tests → static UI → charts → animation pass → packaging. Build every screen static and correct first, then add motion in one dedicated pass. Do not animate a screen that does not yet work.

---

## 2. WHAT THE APP DOES (PLAIN ENGLISH)

I manually type in every transaction I make. The app adds them up for the current month, compares the total against the monthly budget I set, shows me visually where my money went, tells me how much I saved, gives me concrete suggestions to save more, and keeps 36 months of history so I can compare months.

That is the whole product. Nothing else.

---

## 3. TECHNOLOGY STACK

Use exactly this stack. Do not substitute.

| Layer | Technology | Version to use | Why |
|---|---|---|---|
| Runtime | Node.js | 22 LTS or 24 LTS (whichever is current LTS) | Build tooling only |
| Package manager | npm | ships with Node | No pnpm/yarn, keeps it simple |
| Desktop shell | Electron | latest stable in v38 or higher | Mature Windows packaging, no Rust toolchain needed |
| Build tooling | electron-vite | latest stable v4.x | Wires Vite to Electron main/preload/renderer |
| Bundler | Vite | latest stable v7.x | Required by electron-vite |
| UI library | React | latest stable v19.x | — |
| Language | TypeScript | latest stable v5.x | strict mode |
| Styling | Tailwind CSS | latest stable v4.x | Utility CSS, no separate design framework |
| Charts | Recharts | latest stable v3.x | React-native charting, no D3 hand-rolling |
| Icons | lucide-react | latest stable | Bundled SVG icons, no icon font downloads |
| Animation | `motion` (the React package formerly published as `framer-motion`) | latest stable v12.x | Layout, enter/exit and spring animation. Install the package named `motion` and import from `motion/react`. If that package name does not resolve, fall back to `framer-motion` v11+ and tell me you did. |
| State | Zustand | latest stable v5.x | Tiny store, no Redux boilerplate |
| Validation | Zod | latest stable v4.x | Validates every entry and the data file on load |
| Dates | date-fns | latest stable v4.x | Month maths, no moment.js |
| Tests | Vitest | latest stable | Unit tests for calculations only |
| Packaging | electron-builder | latest stable v26.x or higher | Produces the NSIS installer + desktop shortcut |

**Backend: none.** There is no server, no REST API, no Express, no Python. The Electron main process is the only "backend" and it does nothing except read and write one JSON file.

**Database: none.** No SQLite, no Postgres, no MongoDB, no IndexedDB. A single validated JSON file on disk, described in Section 6. At roughly 40 transactions a month over 36 months this is under 1500 records — a JSON file handles this instantly and stays human-readable and trivially backed up.

Before installing, run `npm view <pkg> version` for each package above and print the resolved version table back to me. Then install with those exact versions pinned in `package.json` (no `^` ranges — write exact versions).

---

## 4. PROJECT STRUCTURE

Create exactly this tree. Do not add extra folders.

```
spendledger/
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ tsconfig.web.json
├─ electron.vite.config.ts
├─ electron-builder.yml
├─ tailwind.config.ts
├─ postcss.config.js
├─ vitest.config.ts
├─ .gitignore
├─ DESIGN.md                     ← written FIRST, see Section 10
├─ README.md                     ← non-technical install guide, see Section 12
├─ build/
│  ├─ icon.ico                   ← 256x256 app icon, generated locally
│  └─ installer-header.bmp       ← optional, skip if it complicates the build
└─ src/
   ├─ main/                      ← Electron main process (Node side)
   │  ├─ index.ts                ← creates BrowserWindow, app lifecycle
   │  ├─ storage.ts              ← atomic read/write of data.json
   │  ├─ backup.ts               ← rolling backups + export/import
   │  ├─ retention.ts            ← 36-month archival rule
   │  └─ ipc.ts                  ← registers all IPC handlers
   ├─ preload/
   │  ├─ index.ts                ← contextBridge, exposes window.api
   │  └─ api.d.ts                ← shared type for the exposed API
   └─ renderer/
      ├─ index.html
      └─ src/
         ├─ main.tsx
         ├─ App.tsx              ← shell + routing between 4 screens
         ├─ assets/
         │  └─ fonts/            ← Inter + Fraunces woff2, bundled, never fetched
         ├─ styles/
         │  ├─ index.css         ← Tailwind entry + design tokens
         │  ├─ motion.css        ← easing + duration variables, keyframes
         │  └─ fonts.css         ← @font-face rules pointing at local files
         ├─ types/
         │  └─ models.ts         ← Transaction, Budget, Settings, AppData
         ├─ lib/
         │  ├─ schema.ts         ← Zod schemas for everything
         │  ├─ calc.ts           ← all monthly maths (pure functions)
         │  ├─ suggestions.ts    ← the rules engine, Section 8
         │  ├─ format.ts         ← currency + date formatting
         │  └─ categories.ts     ← default category list + colours
         ├─ store/
         │  └─ useAppStore.ts    ← Zustand store, loads/saves via window.api
         ├─ motion/
         │  ├─ tokens.ts         ← exported duration + easing + spring presets
         │  ├─ variants.ts       ← shared Motion variant objects
         │  ├─ useReducedMotion.ts
         │  ├─ AnimatedNumber.tsx   ← count-up figure, tabular, reduced-motion safe
         │  └─ PageTransition.tsx   ← wraps each page
         ├─ components/
         │  ├─ AppShell.tsx      ← sidebar/nav + header
         │  ├─ GrainOverlay.tsx  ← the signature texture layer
         │  ├─ AuroraHeader.tsx  ← ambient gradient band behind the month title
         │  ├─ StatCard.tsx
         │  ├─ BudgetMeter.tsx   ← the big progress bar
         │  ├─ CategoryDonut.tsx
         │  ├─ DailyBarChart.tsx
         │  ├─ TrendLineChart.tsx
         │  ├─ TransactionForm.tsx  ← the add/edit modal
         │  ├─ TransactionTable.tsx
         │  ├─ SuggestionList.tsx
         │  ├─ MonthPicker.tsx
         │  ├─ EmptyState.tsx
         │  ├─ ConfirmDialog.tsx
         │  └─ Toast.tsx
         └─ pages/
            ├─ Dashboard.tsx
            ├─ Transactions.tsx
            ├─ History.tsx
            └─ Settings.tsx
└─ tests/
   ├─ calc.test.ts
   ├─ suggestions.test.ts
   └─ retention.test.ts
```

---

## 5. THE FOUR SCREENS

Exactly four. A left sidebar switches between them. No router library — a single `activePage` value in the Zustand store is enough.

### 5.1 Dashboard (default screen)

Top of screen: a month selector showing the currently viewed month, with previous/next arrows. Defaults to the current month. Cannot go forward past the current month.

Then, in order down the page:

1. **Four stat cards in a row**: Budget, Spent, Remaining, Saved This Month.
   - Budget = the monthly budget from Settings for that month.
   - Spent = sum of all expense transactions in that month.
   - Remaining = Budget − Spent. Show in red when negative, green when positive.
   - Saved = Remaining when positive, otherwise `₹0` with the label "Over budget by ₹X".
2. **Budget meter**: a wide horizontal progress bar showing Spent as a percentage of Budget. Green under 70%, amber 70–90%, red above 90%, dark red when over 100%. Show the percentage number and the rupee amounts on the bar. Below it, one line of text: "Day 14 of 30 — you are spending ₹620/day, budget pace is ₹500/day."
3. **Two charts side by side**:
   - Left: a donut chart of spend by category, with a legend listing each category, its amount and its percentage, sorted highest first.
   - Right: a vertical bar chart of daily spend for every day of the selected month, with a dashed horizontal line marking the daily budget pace.
4. **Suggestions panel**: the output of the rules engine (Section 8), as a list of cards. Show a maximum of five, highest priority first.
5. **Recent transactions**: the last 8 entries of that month, with a "View all" link that switches to the Transactions screen.

If the month has no transactions, show a friendly empty state with a large "Add your first transaction" button.

### 5.2 Transactions

A table of every transaction in the selected month.

- Columns: Date, Description, Category, Payment method, Type, Amount, and a row action menu (Edit / Delete).
- Sorted newest first by default. Clicking a column header sorts by it.
- A search box filters by description. A category dropdown filters by category.
- A prominent "+ Add transaction" button, top right, opens the same modal used everywhere.
- Deleting asks for confirmation via a dialog. Never delete without confirmation.
- The footer row shows the count and the sum of what is currently visible after filtering.

**The add/edit modal** has these fields, in this order:

| Field | Type | Rules |
|---|---|---|
| Type | Two-button toggle: Expense / Income | Required, defaults to Expense |
| Amount | Number input | Required, greater than 0, max 2 decimal places |
| Date | Date picker | Required, defaults to today, cannot be in the future |
| Category | Dropdown | Required, list from Settings |
| Description | Text | Optional, max 80 characters |
| Payment method | Dropdown: Cash, UPI, Debit card, Credit card, Net banking, Other | Required, defaults to UPI |
| Note | Text | Optional, max 200 characters |

Validate with Zod on submit and show inline field errors. Keyboard: `Enter` saves, `Esc` closes, focus lands on Amount when the modal opens. After saving, keep the modal open only if the user pressed "Save and add another"; otherwise close and show a toast.

### 5.3 History

The 36-month view.

1. A line chart of total spend per month for the last 36 months (or fewer if less data exists), with the monthly budget drawn as a second line for comparison.
2. A table below with one row per month: Month, Budget, Spent, Saved, Savings rate %, Transaction count. Rows are clickable and jump to the Dashboard for that month.
3. A stacked bar chart of the last 12 months broken down by category, so the user can see which categories are growing.
4. A small summary strip at the top: total saved across all months, best-saving month, worst month, and average monthly spend.

### 5.4 Settings

- **Monthly budget**: one number field for the default monthly budget. Also allow overriding the budget for a specific month, stored per month, so past months keep the budget they actually had.
- **Currency symbol**: text field, defaults to `₹`. Locale for number formatting defaults to `en-IN`.
- **Categories**: an editable list. Add, rename, delete, and pick a colour for each. Deleting a category that has transactions is blocked with an explanatory message; offer to reassign those transactions to another category instead.
- **Savings goal**: an optional target savings rate percentage, used by one of the suggestion rules. Default 20%.
- **Data**: three buttons — Export backup (writes a `.json` file wherever the user chooses), Export CSV (all transactions), Import backup (with a confirmation dialog warning it replaces current data). Show the on-disk location of the data file and a "Open folder" button.
- **About**: app version, and a line stating that all data stays on this computer.

**Default categories** to seed on first run: Food & Groceries, Dining Out, Transport, Rent & Utilities, Shopping, Entertainment, Health, Subscriptions, Education, Personal Care, Gifts & Donations, Other. Mark Dining Out, Shopping, Entertainment, Subscriptions and Personal Care as `discretionary: true` — the rules engine needs this flag.

---

## 6. DATA MODEL AND STORAGE

### 6.1 File location

Store everything at `app.getPath('userData')/data.json`, which resolves on Windows to `%APPDATA%/SpendLedger/data.json`. Backups go in `%APPDATA%/SpendLedger/backups/`.

### 6.2 Shape

```ts
type UUID = string;               // crypto.randomUUID()
type ISODate = string;            // "2026-09-09"
type MonthKey = string;           // "2026-09"

interface Transaction {
  id: UUID;
  type: 'expense' | 'income';
  amount: number;                 // positive, stored in major units (rupees)
  date: ISODate;
  categoryId: UUID;
  description: string;            // "" when unset
  paymentMethod: 'cash' | 'upi' | 'debit' | 'credit' | 'netbanking' | 'other';
  note: string;                   // "" when unset
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
}

interface Category {
  id: UUID;
  name: string;
  color: string;                  // hex from the chart palette in DESIGN.md
  discretionary: boolean;
  archived: boolean;
}

interface Settings {
  currencySymbol: string;         // "₹"
  locale: string;                 // "en-IN"
  defaultMonthlyBudget: number;
  savingsGoalPercent: number;     // 20
  firstRunCompleted: boolean;
}

interface AppData {
  schemaVersion: 1;
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
  monthlyBudgets: Record<MonthKey, number>;   // per-month override
  archivedMonths: MonthKey[];                 // months moved out by retention
}
```

Write the matching Zod schema in `src/renderer/src/lib/schema.ts` and validate the file **every time it is loaded**. If validation fails, do not crash and do not overwrite: rename the bad file to `data.corrupt-<timestamp>.json`, restore the newest valid backup, and show the user a clear message about what happened.

### 6.3 Writing safely

Every save must be atomic: write to `data.json.tmp`, `fsync`, then rename over `data.json`. Never write directly to the live file. Debounce saves by 300 ms so rapid edits do not thrash the disk.

### 6.4 Backups

On every successful app start, copy the current `data.json` into `backups/data-<YYYY-MM-DD-HHmm>.json`. Keep the 10 most recent backups and delete older ones. This is cheap insurance and costs the user nothing.

### 6.5 The 36-month retention rule

Implement in `src/main/retention.ts` and run it once at startup.

- The app keeps full transaction detail for the **most recent 36 months**, counted from the current month backwards (so September 2026 keeps back to October 2023).
- Any transaction older than that window is **not deleted**. Move it to `%APPDATA%/SpendLedger/archive/<YYYY>.json`, and record the month key in `archivedMonths`.
- The History screen shows only the 36-month window. Add a single line at the bottom of History reading "Older data archived to your archive folder" with an "Open folder" button when `archivedMonths` is non-empty.
- Never silently destroy user data. That is the whole point of archiving instead of deleting.

Write unit tests in `tests/retention.test.ts` covering: exactly 36 months kept, the 37th month archived, an empty dataset, and a dataset entirely inside the window.

---

## 7. PROCESS ARCHITECTURE AND SECURITY

- `BrowserWindow` created with `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- The renderer never touches `fs`. All disk access goes through IPC.
- Preload exposes exactly this surface on `window.api` and nothing more:

```ts
interface Api {
  loadData(): Promise<AppData>;
  saveData(data: AppData): Promise<{ ok: true } | { ok: false; error: string }>;
  exportBackup(): Promise<{ ok: boolean; path?: string }>;
  exportCsv(): Promise<{ ok: boolean; path?: string }>;
  importBackup(): Promise<{ ok: boolean; data?: AppData; error?: string }>;
  openDataFolder(): Promise<void>;
  getAppVersion(): Promise<string>;
}
```

- Set a strict Content Security Policy that forbids remote content: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'`.
- Block all navigation and all `window.open` calls in the main process.
- Window: 1280×820 default, 1024×700 minimum, remember size and position between launches, centre on first run.

---

## 8. THE SAVINGS SUGGESTIONS ENGINE

This is a pure function in `src/renderer/src/lib/suggestions.ts`:

```ts
function generateSuggestions(input: {
  month: MonthKey;
  transactions: Transaction[];   // all transactions, all months
  categories: Category[];
  budget: number;
  settings: Settings;
  today: Date;
}): Suggestion[];

interface Suggestion {
  id: string;                    // stable rule id
  priority: number;              // 1 = highest
  title: string;                 // short, under 60 chars
  body: string;                  // one or two sentences with real numbers
  tone: 'critical' | 'warning' | 'info' | 'positive';
  potentialSaving?: number;      // rupees, when the rule can quantify it
}
```

Implement these rules. Each returns at most one suggestion. Sort by priority, return the top five. Every message must contain the user's actual numbers, never generic advice.

| # | Rule id | Fires when | Message content | Tone | Priority |
|---|---|---|---|---|---|
| 1 | `over-budget` | Spend already exceeds budget | By how much, and how many days remain | critical | 1 |
| 2 | `pace-ahead` | Projected month-end spend (spend ÷ days elapsed × days in month) exceeds budget by more than 5% | Current daily rate, required daily rate for the rest of the month | critical | 2 |
| 3 | `category-dominant` | One category is over 35% of the month's spend | Name it, its amount and share | warning | 3 |
| 4 | `discretionary-high` | Discretionary categories exceed 30% of total spend | Their combined total, and that a 20% cut saves ₹X | warning | 4 |
| 5 | `category-spike` | A category is more than 25% above its own average over the previous 3 months (needs 3 months of data) | Category, this month vs average, the difference | warning | 5 |
| 6 | `recurring-detected` | The same description (case-insensitive, trimmed) appears with an amount within ±10% in at least 3 of the last 4 months | Likely a subscription; annual cost = monthly × 12 | info | 6 |
| 7 | `small-frequent` | A category has 10 or more transactions each under 5% of the monthly budget | Count and total; small purchases adding up | info | 7 |
| 8 | `savings-rate-low` | Income recorded and (income − expense) ÷ income is below `savingsGoalPercent` | Actual rate vs goal, and the rupee gap | warning | 4 |
| 9 | `weekend-heavy` | Saturday+Sunday spend is over 40% of the month's total | The weekend share and amount | info | 8 |
| 10 | `on-track` | Spend is under 70% of budget with more than a third of the month elapsed | Congratulate, project the likely saving | positive | 9 |
| 11 | `surplus-idle` | The previous month closed with a surplus above 10% of budget | Suggest moving ₹X to savings before it gets absorbed | positive | 8 |
| 12 | `no-data` | Fewer than 3 transactions this month | Prompt to keep logging for accurate insights | info | 10 |

Write `tests/suggestions.test.ts` with at least one test per rule, using fixed dates so tests do not depend on the real clock. Inject `today` rather than calling `new Date()` inside the function.

---

## 9. CALCULATIONS

All in `src/renderer/src/lib/calc.ts`, all pure and all unit-tested in `tests/calc.test.ts`:

- `getMonthTransactions(transactions, monthKey)`
- `getMonthTotals(transactions, monthKey)` → `{ expense, income, net, count }`
- `getBudgetForMonth(monthlyBudgets, settings, monthKey)` → the per-month override if present, otherwise the default
- `getCategoryBreakdown(transactions, categories, monthKey)` → array of `{ category, amount, percent }` sorted descending
- `getDailySeries(transactions, monthKey)` → one entry per day of the month, zero-filled
- `getMonthlySeries(transactions, monthlyBudgets, settings, endMonth, count)` → last N months, zero-filled for months with no data
- `getSavings(budget, expense)` → `{ saved, overspent, percentUsed }`
- `getProjectedSpend(expense, dayOfMonth, daysInMonth)`
- `getSavingsRate(income, expense)`

Rounding rule: keep full precision internally, round only at display time, to 2 decimals. Never accumulate rounded values.

Currency formatting uses `Intl.NumberFormat(settings.locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })` for headline figures and 2 decimals in tables.

---

## 10. DESIGN.md — CREATE THIS FILE FIRST

Write `DESIGN.md` in the repository root with exactly the content below, then implement the UI strictly against it. Map every token into `tailwind.config.ts` as custom theme values and into CSS variables in `src/renderer/src/styles/index.css`, with motion tokens in `styles/motion.css` and mirrored as TypeScript constants in `src/renderer/src/motion/tokens.ts`.

Two absolute rules for this section. **Do not hardcode a colour, duration or easing curve anywhere in a component** — always reference a token. **Every animation listed in the inventory table must actually be implemented**; this app is supposed to feel crafted, and a static build does not meet the brief.

```markdown
# SpendLedger — Design System

## 1. Design concept — "Warm Ledger"

The app should feel like a well-made paper ledger lit by a soft screen,
not like a generic admin dashboard. Three ideas carry that:

- **Warm neutrals, cool accent.** Backgrounds are warm off-white paper in
  light mode and near-black ink in dark mode. The single accent is a cool
  indigo-violet. The contrast between warm ground and cool ink is what
  makes the app look deliberate rather than templated.
- **Texture.** A barely-visible grain sits over the whole app. It is the
  signature detail and costs nothing at runtime.
- **Motion with intent.** Nothing moves for decoration. Things move to
  show change: a figure counting to its new value, a meter filling, a
  chart growing from its baseline. Motion is fast, springy and never
  blocks input.

Restraint is part of the design. One accent colour, one texture, one
ambient animation. Everything else is quiet.

## 2. Colour tokens

### Light theme (:root)
--bg-app:         #F5F3EE   /* warm paper */
--bg-surface:     #FFFDFA
--bg-subtle:      #EDEAE2
--bg-inset:       #E7E3D9
--border:         #E2DED4
--border-strong:  #CBC5B8
--text-primary:   #1A1815
--text-secondary: #5C574E
--text-muted:     #8C867A
--accent:         #4F46E5
--accent-hover:   #4338CA
--accent-soft:    #ECEBFD   /* tinted background for active nav, chips */
--accent-ring:    rgba(79, 70, 229, 0.35)
--success:        #1A9E5F
--warning:        #C8811A
--danger:         #D64545
--positive-bg:    #E8F5EE
--warning-bg:     #FBF2E2
--danger-bg:      #FBEAEA
--grain-opacity:  0.035
--shadow-card:    0 1px 2px rgba(26, 24, 21, 0.04)
--shadow-lift:    0 6px 20px rgba(26, 24, 21, 0.08)
--shadow-modal:   0 24px 60px rgba(26, 24, 21, 0.22)

### Dark theme ([data-theme="dark"] and prefers-color-scheme: dark)
--bg-app:         #100F13   /* ink */
--bg-surface:     #191820
--bg-subtle:      #201F29
--bg-inset:       #16151C
--border:         #2B2936
--border-strong:  #3D3A4C
--text-primary:   #F2F0EC
--text-secondary: #A8A2B4
--text-muted:     #736E80
--accent:         #8B7CFF
--accent-hover:   #A394FF
--accent-soft:    #211E38
--accent-ring:    rgba(139, 124, 255, 0.40)
--success:        #34C77B
--warning:        #E0A038
--danger:         #F06A6A
--positive-bg:    #12271C
--warning-bg:     #2A2114
--danger-bg:      #2C1719
--grain-opacity:  0.055
--shadow-card:    0 1px 2px rgba(0, 0, 0, 0.40)
--shadow-lift:    0 6px 20px rgba(0, 0, 0, 0.55)
--shadow-modal:   0 24px 60px rgba(0, 0, 0, 0.70)

Define the complete light palette on bare :root. Redefine only the tokens
inside the dark blocks, so nothing has its only definition in a media query.
Theme follows the OS by default with a manual override in Settings.

### Signature gradient
--grad-accent: linear-gradient(100deg, #4F46E5 0%, #7C3AED 45%, #DB2777 100%)
Dark:          linear-gradient(100deg, #8B7CFF 0%, #A78BFA 45%, #F472B6 100%)

Used in exactly three places and nowhere else: the aurora header band,
the budget meter fill, and the 2px top edge of the active sidebar item.
Overusing this gradient is the fastest way to make the app look cheap.

## 3. Signature elements

These seven details are what make the app look like itself. Implement all
of them.

1. **Grain overlay.** A fixed, pointer-events-none full-window layer
   containing an inline SVG `feTurbulence` filter (baseFrequency 0.8,
   numOctaves 3), rendered at `--grain-opacity`, `mix-blend-mode: overlay`,
   `z-index: 1` beneath all content. Generated once, never animated.
2. **Aurora header band.** Behind the month title on the Dashboard, a 180px
   tall band with three blurred radial gradient blobs from the signature
   gradient at 22% opacity, `filter: blur(60px)`, drifting slowly. It is
   ambient, sits behind text, and must never reduce text contrast.
3. **The Ribbon budget meter.** Not a plain progress bar. A 14px tall
   capsule with an inset track, a gradient fill, a soft sheen highlight
   that sweeps across the fill once when the value changes, and three
   hairline milestone ticks at 70%, 90% and 100%. The fill colour crosses
   between states rather than snapping. Above 100% the capsule gains a
   1px danger-coloured outer ring.
4. **Counting figures.** Every headline number counts from its previous
   value to its new one. Tabular numerals so the width never jitters.
5. **Living donut.** The category donut has a hollow centre that shows the
   total; hovering a segment crossfades the centre to that category's name
   and amount, and lifts the hovered segment outward by 4px.
6. **Growing bars.** Daily bars scale up from the baseline with a 12ms
   stagger. The bar for today carries a small pulsing accent dot above it.
7. **Shimmer on success.** When a month ends under budget, the Saved stat
   card runs a single diagonal light sweep across it, once, on mount. No
   confetti, no sound, no repeat.

## 4. Chart palette

Category colours, assigned in this order:

#4F46E5  #1A9E5F  #C8811A  #7C3AED  #DB2777
#0E9AA7  #E2643A  #5B7CFA  #7C7566  #9A6B1F
#0E7490  #A21C68

Budget meter states: success below 70%, warning 70–90%,
danger 90–100%, and #A8253F above 100%.
Chart gridlines use --border. Axis labels use --text-muted at 12px.
Chart tooltips are surface cards with --shadow-lift, never the library default.

## 5. Typography

Two faces, both bundled locally as woff2 in `src/renderer/src/assets/fonts`
and declared with @font-face using `font-display: swap`. Never load a font
over the network — the app must render identically offline.

- **Fraunces** (or Instrument Serif if Fraunces is unavailable) — the
  display face. Used for exactly two things: the month title on the
  Dashboard and History, and the single hero "Spent" figure. Nothing else.
- **Inter** — everything else. Fallback stack:
  Inter, "Segoe UI", system-ui, sans-serif.

Every figure and every table cell carrying a number uses
`font-variant-numeric: tabular-nums`.

Scale:
- Display serif (month title)   34px / 400 / -0.01em
- Hero figure (serif)           40px / 400 / -0.02em
- Figure (sans, stat cards)     30px / 600 / -0.02em
- H1 page title                 22px / 600
- H2 section                    16px / 600
- Body                          14px / 400
- Label / table header          12px / 500 / 0.02em / uppercase
- Caption                       12px / 400 / text-muted

Line height 1.5 for body, 1.15 for figures and display text.

## 6. Spacing, shape, elevation

4px scale: 4, 8, 12, 16, 24, 32, 48, 64.
Card padding 20px. Grid gap 16px. Page gutter 28px.
Radius: 8px controls, 14px cards, 20px modals, 999px pills and the meter.
Every card carries a 1px --border and --shadow-card. Only three things ever
use --shadow-lift: a hovered card, a chart tooltip, an open dropdown.
Only the modal uses --shadow-modal.

## 7. Components

Card: bg-surface, 1px border, 14px radius, 20px padding, --shadow-card.
  On hover: border becomes --border-strong, translateY(-2px), --shadow-lift.
StatCard: 12px uppercase muted label, then the figure, then an optional
  12px delta line in success or danger. The figure is an AnimatedNumber.
Button primary: accent bg, white text, 36px tall, 8px radius, 14px / 500.
  Hover lightens to accent-hover; active scales to 0.97.
Button secondary: transparent, 1px --border-strong, --text-primary.
Button danger: danger bg, white text. Delete confirmation only.
Input: 36px tall, 1px border, 8px radius, 14px text. Focus draws a 2px
  --accent-ring and the border turns accent. No browser default outline.
Table: 44px rows, 12px uppercase muted header, 1px row separators,
  numeric columns right-aligned and tabular, row hover tints to --bg-subtle.
Modal: 520px wide, centred, 20px radius, backdrop rgba(0,0,0,0.5) with a
  4px backdrop blur.
Toast: bottom-right, 3.5s auto-dismiss, max 3 stacked.
Sidebar: 220px fixed, --bg-subtle, 38px items. The active item has an
  --accent-soft background, accent text, and a 2px signature-gradient top edge.
Suggestion card: --bg-surface with a 3px left rail coloured by tone
  (danger / warning / accent / success), an icon, a bold title, and body text.
Empty state: a centred inline SVG illustration that drifts 6px vertically
  on a 6s loop, a headline, and one primary button.

## 8. Motion system

### Tokens
--dur-instant: 90ms
--dur-fast:    150ms
--dur-base:    240ms
--dur-slow:    420ms
--dur-ambient: 18s

--ease-out:    cubic-bezier(0.16, 1, 0.30, 1)     /* default for entrances */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)     /* state crossfades */
--ease-in:     cubic-bezier(0.55, 0, 1, 0.45)     /* exits only */

Spring presets for the Motion library, exported from motion/tokens.ts:
  springSoft  = { type: 'spring', stiffness: 240, damping: 28, mass: 0.9 }
  springSnap  = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }

### Principles
- Animate **transform and opacity only**. Never animate width, height, top,
  left, margin or padding — they force layout and cause jank.
  The budget meter fills with `transform: scaleX()`, not `width`.
- Entrances use --ease-out. Exits are faster than entrances and use --ease-in.
- Nothing on screen animates for longer than --dur-slow, with the single
  exception of the ambient aurora and the empty-state drift.
- Motion never blocks input. Every animated control is clickable
  from frame one.
- Charts animate once on mount and when the selected month changes.
  They must not re-animate on unrelated re-renders — key them on the
  month value so React remounts them deliberately.
- Do not stack animations on one element. One property change, one purpose.

### Animation inventory — implement every row

| # | Element | What happens | Duration | Easing | How |
|---|---|---|---|---|---|
| 1 | Page switch | Outgoing fades out and drops 4px; incoming fades in and rises from 8px | 200ms in / 120ms out | ease-out / ease-in | Motion `AnimatePresence mode="wait"` in PageTransition |
| 2 | Stat cards on mount | Fade and rise 12px, staggered 60ms apart | 240ms | ease-out | Motion stagger container |
| 3 | Headline figures | Count from previous value to new value | 700ms | ease-out | AnimatedNumber using `requestAnimationFrame`, tabular numerals |
| 4 | Budget meter fill | scaleX from current to target, colour crossfades between states | 600ms | ease-out | Motion `animate` on transform + backgroundColor |
| 5 | Meter sheen | One diagonal highlight sweeps across the fill after it settles | 900ms | ease-in-out | CSS keyframe, `animation-iteration-count: 1` |
| 6 | Donut on mount | Segments sweep clockwise from 0° | 500ms | ease-out | Recharts `isAnimationActive` with `animationDuration` |
| 7 | Donut hover | Hovered segment translates 4px outward, centre label crossfades | 150ms | ease-out | Recharts activeShape + Motion crossfade |
| 8 | Daily bars | Each bar scales up from the baseline, 12ms stagger | 400ms | ease-out | Recharts `animationBegin` per index |
| 9 | Today's bar | A 6px accent dot above it pulses opacity 0.4 → 1 → 0.4 | 2s loop | ease-in-out | CSS keyframe |
| 10 | Trend line | Line draws left to right via stroke-dashoffset | 800ms | ease-out | CSS on the Recharts path |
| 11 | Suggestion cards | Fade and slide in from 10px left, 45ms stagger | 220ms | ease-out | Motion stagger |
| 12 | Suggestion dismiss | Collapses and fades, remaining cards reflow smoothly | 180ms | ease-in | Motion `layout` + AnimatePresence |
| 13 | Modal open | Backdrop fades in; panel scales 0.96 → 1 and rises 12px | springSnap | — | Motion |
| 14 | Modal close | Panel scales to 0.98 and fades | 120ms | ease-in | Motion |
| 15 | Table row insert | New row fades in with a brief accent-soft background flash | 300ms | ease-out | Motion `layout` on rows |
| 16 | Table row delete | Row fades and collapses, rows below slide up | 200ms | ease-in | Motion AnimatePresence |
| 17 | Toast | Slides in 24px from the right and fades | springSoft | — | Motion |
| 18 | Card hover | translateY(-2px), shadow deepens, border strengthens | 150ms | ease-out | CSS transition |
| 19 | Button press | scale 0.97 while held | 90ms | ease-out | CSS `:active` |
| 20 | Sidebar active marker | The 2px gradient edge slides between items | springSoft | — | Motion `layoutId` shared element |
| 21 | Month change | Whole dashboard content crossfades; all figures recount | 180ms | ease-in-out | Key the content on the month value |
| 22 | Aurora blobs | Three blobs drift and scale slowly, offset phases | 18s loop | ease-in-out | CSS keyframes, transform only |
| 23 | Saved-card shimmer | One diagonal light sweep, once, when the month closes under budget | 1.1s | ease-in-out | CSS keyframe, runs once |
| 24 | Empty state | Illustration drifts 6px vertically | 6s loop | ease-in-out | CSS keyframe |
| 25 | Theme switch | Background and text colours crossfade | 240ms | ease-in-out | CSS transition on colour properties only |
| 26 | Loading | A skeleton shimmer on cards while data loads on first paint | 1.4s loop | linear | CSS gradient keyframe |

### Reduced motion — mandatory

Read `prefers-reduced-motion: reduce` in `useReducedMotion.ts` and thread it
through the Motion provider. When it is set:
- Every duration collapses to 0 except colour and opacity fades, which stay
  at --dur-instant.
- Counting figures render their final value immediately.
- The aurora, the pulsing dot, the shimmer and the empty-state drift stop
  entirely.
- Chart animations are disabled via `isAnimationActive={false}`.
Also ship the CSS safety net:
`@media (prefers-reduced-motion: reduce) { *, *::before, *::after {
animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
transition-duration: 0.01ms !important; } }`

### Performance guardrails
- Never animate more than roughly 30 elements at once. Stagger, do not swarm.
- Apply `will-change` only to the aurora blobs and the meter fill, and
  remove it after the animation settles.
- The idle app must sit near 0% CPU. If the aurora keeps the process awake,
  pause it when the window loses focus — listen for the Electron blur and
  focus events and toggle a `data-window-blurred` attribute on the root.

## 9. Accessibility
Body text contrast at least 4.5:1 in both themes, including over the aurora
and the grain. Never encode meaning in colour alone: the meter states its
percentage in text, and every suggestion carries an icon plus a tone word.
Every interactive element is keyboard-reachable with a visible focus ring
using --accent-ring. Modals trap focus and close on Escape. Every icon-only
button has an aria-label. Animated regions that update figures use
`aria-live="polite"` so the value is announced once it settles, not on
every animation frame.

## 10. Layout
Sidebar 220px + fluid content, max content width 1240px, centred.
Dashboard grid: 4 stat cards in a row at width ≥ 1100px, 2×2 below 1100px,
stacked below 720px. The two charts sit side by side above 1100px and stack
below it. Any chart or table that cannot shrink further scrolls inside its
own container; the page body never scrolls horizontally.
```

**Fonts, to be explicit:** downloading the Inter and Fraunces woff2 files *once during development* and committing them into `src/renderer/src/assets/fonts` is correct and expected. What is forbidden is the shipped app fetching a font at runtime. Prefer installing them as npm packages (for example `@fontsource/inter` and `@fontsource/fraunces`) so the files arrive with `npm install` and are bundled by Vite. If neither font can be obtained, fall back to the system stack, keep the identical type scale, and tell me it happened.

---

## 11. BUILD, PACKAGING AND THE DESKTOP ICON

Configure `electron-builder.yml` so that `npm run build:win` produces a Windows installer:

- `appId: com.spendledger.app`, `productName: SpendLedger`
- Target: `nsis`, architecture `x64`
- `oneClick: false` so the user can choose the install folder
- `allowToChangeInstallationDirectory: true`
- **`createDesktopShortcut: true`** and `createStartMenuShortcut: true` — this is the desktop icon the user asked for
- `perMachine: false` so no administrator rights are needed
- Icon from `build/icon.ico`
- `publish: null` — no auto-update, no update server
- `artifactName: SpendLedger-Setup-${version}.exe`

Generate `build/icon.ico` locally at 256×256: a simple wallet or ledger glyph in the accent blue on a white rounded square. Produce it with a local script (for example using `sharp` or `png-to-ico` as a dev dependency) — do not download an icon from the internet.

Scripts in `package.json`:

```
dev          → electron-vite dev
typecheck    → tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json
test         → vitest run
build        → npm run typecheck && npm run test && electron-vite build
build:win    → npm run build && electron-builder --win --x64
```

If `electron-builder` NSIS packaging fails for any environment reason, fall back to `electron-builder --win --dir` to produce a portable folder, and tell me plainly that this happened and what the workaround is. Do not silently ship something different from what was asked.

---

## 12. README.md FOR A NON-TECHNICAL USER

Write `README.md` aimed at someone who has never used a terminal. It must contain:

1. What the app does, in three sentences.
2. **How to install**: where `SpendLedger-Setup-x.y.z.exe` is after the build (`dist/`), that Windows SmartScreen will show "Windows protected your PC" because the app is not code-signed, and that the user clicks "More info" then "Run anyway". Explain this is expected for a personal unsigned app.
3. How to launch it from the desktop icon.
4. Where the data lives (`%APPDATA%/SpendLedger/data.json`) and how to back it up by copying that file.
5. How to move the app to a new PC: install, then use Import backup in Settings.
6. A short troubleshooting section: app will not open, data looks wrong, restore from backup.

No developer jargon in this file.

---

## 13. ACCEPTANCE CHECKLIST

Do not tell me the project is finished until every one of these is true, and report the result of each:

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run test` passes, with tests covering all functions in Section 9 and every rule in Section 8
- [ ] `npm run dev` opens the app and the Dashboard renders with seeded default categories
- [ ] Adding a transaction updates the stat cards, budget meter, donut and daily bar chart immediately
- [ ] Closing and reopening the app preserves all data
- [ ] Editing and deleting transactions works, with delete confirmation
- [ ] The month selector moves through past months correctly and cannot move past the current month
- [ ] Setting a budget for a past month does not change other months' budgets
- [ ] History shows up to 36 months, zero-filled where there is no data
- [ ] Retention archives a transaction dated 37 months ago and keeps one dated 36 months ago
- [ ] All 12 suggestion rules can be triggered, and messages contain real numbers
- [ ] Export backup, Export CSV and Import backup all work end to end
- [ ] Corrupting `data.json` by hand does not crash the app; it restores from backup and explains what happened
- [ ] The app works fully with the network adapter disabled
- [ ] Light and dark themes both render correctly and follow `DESIGN.md` tokens
- [ ] All 26 rows of the animation inventory are implemented and visible
- [ ] All seven signature elements are present: grain, aurora, ribbon meter, counting figures, living donut, growing bars, success shimmer
- [ ] Both bundled fonts render with the network disabled, and the display serif appears only on the month title and the hero figure
- [ ] Turning on "Show animations in Windows" → off in Windows settings (or forcing `prefers-reduced-motion`) removes all motion and the app stays fully usable
- [ ] No animation animates width, height, top, left, margin or padding
- [ ] The app sits near 0% CPU when idle and when the window is not focused
- [ ] Keyboard-only operation works: add, save and close a transaction without a mouse
- [ ] `npm run build:win` produces `SpendLedger-Setup-x.y.z.exe`
- [ ] Installing that file creates a working desktop icon that launches the app

---

## 14. HOW TO REPORT BACK TO ME

I am not technical. When you finish each checkpoint, tell me in plain language what now works and what to click to see it. If you have to make a judgement call I did not cover, state the assumption you made in one sentence and carry on — do not stop and wait unless the choice would break something.

If any part of this specification is impossible or a bad idea, say so once, explain why in plain English, propose the alternative, and then build the rest.
