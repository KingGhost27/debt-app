# CLAUDE.md

This file provides guidance to Claude Code when working with Cowculator.

## Project Overview

**Cowculator** — a kawaii-themed debt payoff dashboard for tracking debts, comparing payoff strategies (Avalanche vs Snowball), and planning the debt-free journey.

- **Frontend:** React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- **Backend:** Supabase (auth + PostgreSQL database)
- **Deploy:** Vercel (auto-deploys on push to `main`)
- **PWA:** Service worker via vite-plugin-pwa

**Status:** Active development

---

## MANDATORY Git Workflow - DO NOT SKIP

Before writing ANY code, you MUST:
1. Create a feature branch: `git checkout -b feature/[name]`
2. Commit changes FREQUENTLY (every file/component)
3. NEVER work on main branch directly

**If you complete a task without proper Git commits = TASK INCOMPLETE**

**Commit message format:**
```bash
git commit -m "[Type] Brief description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Commands

```bash
npm run dev      # ⭐ DEFAULT — start dev server (Vite HMR on http://localhost:5173). Use this for normal frontend work.
npm run build    # TypeScript check + production build
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

**⚠️ Stripe / API testing only:** `npm run dev` runs Vite alone and does NOT serve `/api/*` serverless functions (checkout, webhook). For Stripe testing use `vercel dev` instead — see "Local Dev Server Notes" below.

---

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 4 (custom theme in `src/index.css` via CSS variables)
- React Router DOM 7 for navigation
- React Context for global state (`AppContext`, `AuthContext`)
- Supabase JS client for auth + data (`src/lib/supabase.ts`)
- Recharts for visualizations
- date-fns for date formatting, Decimal.js for precision math
- lucide-react for icons

---

## Architecture

**Auth Flow:**
```
Email/password signup → Supabase sends confirmation email
→ User clicks link → redirected to app origin
→ Supabase session established → AuthContext picks up user
→ AppContext loads user data from Supabase
→ OnboardingPage shown if settings.userName is empty
→ Normal app routes rendered
```

**Data Flow:**
```
User Action → useApp() context → Supabase write (optimistic state update first)
→ Re-render → useMemo calculations → UI
```

**Offline / Fallback:** `localStorage` is used as cache for export/import only. Supabase is the source of truth.

---

## Supabase Tables

| Table | Description |
|-------|-------------|
| `profiles` | User display name, currency, date format, theme, category colors |
| `debts` | Debt records (name, category, balance, APR, minimum payment, due day) |
| `payments` | Payment history (amount, principal, interest, date, type, completion) |
| `strategy_settings` | Payoff strategy (avalanche/snowball), recurring funding, one-time fundings |
| `budget_settings` | Income sources, monthly expenses, debt allocation amount, expense entries |
| `custom_categories` | User-defined debt categories (name, color) |
| `assets` | Asset tracking (name, type, balance, balance history) |
| `subscriptions` | Subscription tracking (name, amount, billing cycle, due day) |
| `received_paychecks` | Logged paychecks (amount, pay period, income source reference) |

---

## Key Modules

| Module | Purpose |
|--------|---------|
| `types/index.ts` | All TypeScript interfaces and default values |
| `context/AuthContext.tsx` | Supabase auth state (user, session, sign in/up/out, password reset) |
| `context/AppContext.tsx` | Global app state + all CRUD operations via `useApp()` hook |
| `lib/supabase.ts` | Supabase client initialization |
| `lib/calculations.ts` | Financial engine: amortization, payoff plan, income/budget calculations |
| `lib/milestones.ts` | Milestone computation, debt payoff timeline, payment streaks |
| `lib/billDistribution.ts` | Bill distribution across pay periods |
| `lib/storage.ts` | Data export/import (JSON + CSV), not used for persistence |
| `lib/themes.ts` | Theme presets and `applyTheme()` function |
| `pages/` | App views (see Routes below) |
| `components/layout/` | `Layout.tsx`, `BottomNav.tsx` |
| `components/ui/` | Shared UI components (see list below) |
| `components/analytics/` | Chart components (InterestVsPrincipalChart, DebtBreakdownChart, PaymentHistorySummary) |

---

## Routes

```
/           → HomePage        (dashboard: progress rings, milestones, charts)
/debts      → DebtsPage       (add/edit/delete debts, donut chart)
/assets     → AssetsPage      (track assets, balance history)
/subscriptions → SubscriptionsPage (subscription management)
/plan       → PlanPage        (budget config + payoff schedule — merged)
/track      → TrackPage       (log paychecks, mark payments, view history)
/settings   → SettingsPage    (themes, categories, name, data export/import, notifications)
/strategy   → redirects to /plan
/more       → redirects to /
```

**Special routes (no layout/nav):**
- `OnboardingPage` — shown inside `AppRouter` when `settings.userName === ''` (new users)
- `AuthPage` — shown when no Supabase session
- `ResetPasswordPage` — shown when `isPasswordRecovery` flag is set

---

## UI Components (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `DebtsyCow` | The app mascot — kawaii cow SVG |
| `ProgressRing` | Animated circular progress indicator |
| `DebtModal` | Add/edit debt form |
| `AssetModal` | Add/edit asset form |
| `PaymentModal` | Log payment form |
| `PaycheckModal` | Log paycheck form |
| `SubscriptionModal` | Add/edit subscription form |
| `IncomeSourceModal` | Add/edit income source form |
| `OneTimeFundingModal` | Add one-time extra payment form |
| `UpdateBalanceModal` | Update asset balance with history note |
| `ThemeSelector` | Theme picker cards |
| `CategoryManager` | Custom category CRUD |
| `ConfirmDialog` | Reusable confirmation modal |
| `Toast` | Toast notification system (`useToast` hook) |
| `EmptyState` | Empty state placeholder with call-to-action |
| `MilestoneTracker` | Visual milestone progress tracker |
| `DebtPayoffTimeline` | Timeline of when each debt gets paid off |
| `DebtOverTimeChart` | Line chart of total debt over time |
| `PaymentStreakCard` | Payment streak tracker |
| `UpcomingBills` | Upcoming bill calendar |
| `MiniCalendar` | Mini calendar with bill/income markers |
| `BillDistributionPanel` | Shows bills mapped to pay periods |
| `ExpenseTracker` | Monthly expense tracking UI |
| `HelpTooltip` | Info tooltip helper |

---

## Key Patterns

- **Type imports:** Use `import type { Debt }` for type-only imports
- **State access:** Call `useApp()` hook (component must be inside `<AppProvider>`)
- **Auth access:** Call `useAuth()` hook (component must be inside `<AuthProvider>`)
- **Expensive calculations:** Wrap with `useMemo` (see payoff plan generation)
- **Dates:** Stored as ISO strings, use date-fns for display formatting
- **IDs:** Generated with `uuid` package
- **Mobile-first:** Bottom navigation (4 items: Home, Debts, Plan, Track), touch-friendly targets
- **Optimistic updates:** State updates happen immediately; Supabase writes happen async after
- **Theme CSS variables:** Themes apply via CSS custom properties in `:root`, set by `applyTheme()`

---

## Theme Presets

`'default' | 'my-melody' | 'kuromi' | 'cinnamoroll' | 'pompompurin' | 'hello-kitty' | 'keroppi' | 'chococat' | 'maple' | 'custom'`

---

## Monetization — Pro Tier Gating

**Tier strategy** (launch): Free + Pro. Three Pro SKUs: Monthly $4.99, Annual $39.99, OG Heifer $19 one-time (first 200–300 members).

**Free-tier caps** (source: `src/lib/tierLimits.ts`):
- 4 debts, 2 income sources, 10 expense entries, 3 custom categories
- 3 free themes: `default` (Lavender Dream), `my-melody` (Rose Milk), `cinnamoroll` (Cloud Nine)
- Strategy Comparison chart is **always free** (core value — explicit decision, do not gate).

**Pro-only features** (soft-gate, not hard-disable):
- Asset tracking page, Interest vs Principal chart, Payment Streak, Payment History, Bill Calendar, Bill Distribution Panel, CSV/JSON data export, 7 remaining themes.

**UX pattern:** Soft-gate. Features remain visible; clicking triggers `UpgradeModal`. Avoid heavy paywalls — reason: Flora's explicit preference based on frustration with competitor apps.

**Key files:**
| File | Purpose |
|---|---|
| `src/lib/tierLimits.ts` | Single source of truth: `FREE_LIMITS`, `FREE_THEMES`, `PRO_FEATURE_COPY` |
| `src/hooks/useFeatureGate.ts` | Unified gate hook — exposes `canAddDebt`, `isAssetTrackingLocked`, `isThemeLocked(preset)`, etc. |
| `src/hooks/useSubscription.ts` | Queries `user_subscriptions` table, exposes `isPro`, `isLoading` |
| `src/components/ui/ProLockedOverlay.tsx` | Soft-gate overlay with gradient card + "Upgrade to Pro" CTA |
| `src/components/ui/ProLockBadge.tsx` | Small crown/lock pill (variants) |
| `src/components/ui/UpgradeModal.tsx` | 3-plan picker → calls `/api/create-checkout` |

**Stripe serverless endpoints** (`api/`):
- `create-checkout.ts` — creates Stripe Checkout session (expects `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_LIFETIME`)
- `create-portal.ts` — customer portal session
- `stripe-webhook.ts` — handles `checkout.session.completed`, `customer.subscription.updated/deleted` → writes `user_subscriptions` table via service role

**Supabase:** `user_subscriptions` table tracks Pro status (see `migrations/2026-04-23_user_subscriptions.sql`). RLS allows users to read own row; only service role writes (via webhook).

**Env vars for Stripe** (in `.env.local`, NOT `VITE_`-prefixed except publishable key):
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...     # client
STRIPE_SECRET_KEY=sk_test_...                # server
STRIPE_PRICE_MONTHLY=price_...               # server
STRIPE_PRICE_ANNUAL=price_...                # server
STRIPE_PRICE_LIFETIME=price_...              # server (mapped from "OG Heifer" SKU)
STRIPE_WEBHOOK_SECRET=whsec_...              # server
```

---

## Local Dev Server Notes

- **Dev command:** `vercel dev` is required to serve `/api/*` routes locally (Vite alone 404s them). Bind `0.0.0.0:5173` for WSL → Windows browser access: `vercel dev --listen 0.0.0.0:5173`.
- **Env loading:** `vercel dev` sometimes doesn't auto-load `.env.local`. If Stripe SDK throws "Neither apiKey nor config.authenticator provided", start with `bash -c 'set -a; source .env.local; set +a; exec vercel dev'`.
- **vite.config.ts** has `server.host: true` so Vite binds all interfaces (needed for WSL).
- **vercel.json** uses negative-lookahead rewrite `/((?!api/).*)` → `/index.html` so SPA catch-all doesn't swallow `/api/*` requests.
- **Stripe webhook testing locally:** `stripe listen --forward-to localhost:5173/api/stripe-webhook`. Whsec persists across `stripe listen` restarts for the same CLI session.

---

## Data Types Quick Reference

```typescript
// Auth
User, Session     // from @supabase/supabase-js

// Core entities
Debt              // id, name, category, balance, originalBalance, apr, minimumPayment, dueDay, creditLimit?, notes?
Payment           // id, debtId, amount, principal, interest, date, type, isCompleted
Asset             // id, name, type, balance, balanceHistory, notes?
Subscription      // id, name, amount, billingCycle, dueDay, category, notes?
ReceivedPaycheck  // id, incomeSourceId, actualAmount, payDate, payPeriodStart, payPeriodEnd

// Strategy & budget
PayoffStrategy    // 'avalanche' | 'snowball'
StrategySettings  // strategy + recurringFunding + oneTimeFundings[]
BudgetSettings    // incomeSources[], monthlyExpenses, debtAllocationAmount, expenseEntries[]
IncomeSource      // id, name, type, payFrequency, amount?, hourlyRate?, hoursPerWeek?, deductions?
ExpenseEntry      // id, name, amount, category, dueDay?
PayFrequency      // 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly'
EmploymentType    // 'salary' | 'hourly'

// User
UserSettings      // userName, currency, dateFormat, theme, categoryColors
ThemeSettings     // preset + customColors?
CustomCategory    // id, name, color, createdAt

// Generated plans
PayoffPlan        // debtFreeDate, totalPayments, totalInterest, steps[], monthlyBreakdown[]
```

---

## Files to Modify for Common Tasks

| Task | Files |
|------|-------|
| Add debt field | `types/index.ts`, `DebtModal.tsx`, `context/AppContext.tsx` |
| Modify payoff calculations | `lib/calculations.ts` |
| Change theme colors | `lib/themes.ts` (presets), `index.css` (CSS variables) |
| Add new theme preset | `lib/themes.ts` (THEME_PRESETS + THEME_METADATA + THEME_DECORATIONS), `types/index.ts` (ThemePreset union) |
| Add new page | `pages/NewPage.tsx`, `App.tsx` (route), `BottomNav.tsx` if nav item needed |
| Change state shape | `types/index.ts`, `AppContext.tsx`, add Supabase migration if needed |
| Add new Supabase table op | `AppContext.tsx` (add to interface + implement with `withSync`) |
| Add custom category feature | `CategoryManager.tsx`, `DebtModal.tsx`, `types/index.ts` |
| Modify income/budget | `lib/calculations.ts`, `PlanPage.tsx` |
| Modify onboarding | `pages/OnboardingPage.tsx`, `App.tsx` (AppRouter component) |
| Change free-tier limits | `lib/tierLimits.ts` (single source of truth) |
| Add Pro-gated feature | `hooks/useFeatureGate.ts` (add new gate), wrap with `ProLockedOverlay` in consuming page |
| Add new Stripe plan | `api/create-checkout.ts` (price map), `UpgradeModal.tsx` (PLANS array), `.env.local` (new price ID) |

---

## Notes

- Avalanche = highest APR first (saves money). Snowball = lowest balance first (psychological wins).
- `DEFAULT_APP_DATA` in `types/index.ts` provides initial state structure.
- WSL screenshot paths: `C:\Users\forel\Pictures\Screenshots\foo.png` → read as `/mnt/c/Users/forel/Pictures/Screenshots/foo.png`
- Bottom nav has 4 items: Home, Debts, Plan, Track. Settings accessed via gear icon on each page header.
- The `withSync` helper in AppContext wraps Supabase operations with sync status tracking.
