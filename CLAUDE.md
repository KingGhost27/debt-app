# CLAUDE.md

This file provides guidance to Claude Code when working with the Debt Payoff App.

## Project Overview

React-based debt payoff dashboard for tracking debts, comparing payoff strategies (Avalanche vs Snowball), and planning the debt-free journey. All data persists in localStorage—no backend required.

**Status:** Active development

---

## MANDATORY Git Workflow - DO NOT SKIP

Before writing ANY code, you MUST:
1. Create a feature branch: `git checkout -b feature/[name]`
2. Commit changes FREQUENTLY (every file/component)
3. NEVER work on main branch directly

**If you complete a task without proper Git commits = TASK INCOMPLETE**

        ---

## Critical: Git Workflow Requirements

**IMPORTANT**: You MUST follow the Git workflow for ALL code changes:

1. **ALWAYS create a feature branch BEFORE making changes**
        ```bash
        git checkout -b feature/[feature-name] # or fix/[bug-name]
        ```

2. **Commit changes REGULARLY during development**
 - After completing each major step
 - When switching between different files/features
 - Before running build tests
 - Use meaningful commit messages with [Type] prefix

3. **NEVER work directly on main branch**
 - All changes must go through feature branches
 - Create pull requests for review

4. **Commit message format**:
        ```bash
        git commit -m "[Type] Brief description

        Generated with [Claude Code](https://claude.ai/code)

        Co-Authored-By: Claude <noreply@anthropic.com>"
        ```

**Failure to follow Git workflow = Incomplete task**


## Commands

```bash
npm run dev      # Start dev server (Vite HMR on http://localhost:5173)
npm run build    # TypeScript check + production build
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS 4 (custom theme in `src/index.css`)
- React Router DOM 7 for navigation
- React Context for state management
- Recharts for visualizations
- date-fns for date formatting, Decimal.js for precision math

## Architecture

**Data Flow:**
```
User Action → useApp() context → localStorage sync → Re-render → useMemo calculations → UI
```

**Key Modules:**

| Module | Purpose |
|--------|---------|
| `types/index.ts` | All TypeScript interfaces (Debt, Payment, Strategy, Theme, Budget, etc.) |
| `context/AppContext.tsx` | Global state + CRUD operations via `useApp()` hook |
| `lib/calculations.ts` | Financial engine: amortization, payoff plan, income calculations |
| `lib/storage.ts` | localStorage persistence, data migrations, import/export JSON |
| `lib/themes.ts` | Theme presets (My Melody, Kuromi) and applyTheme() function |
| `hooks/useTheme.ts` | Theme management hook for components |
| `pages/` | 7 views: Home, Debts, Budget, Plan, Track, Settings, Strategy |
| `components/layout/` | Layout wrapper, BottomNav, PageHeader |
| `components/ui/` | DebtModal, ProgressRing, ThemeSelector, CategoryManager, IncomeSourceModal |

**Routes (defined in App.tsx):**
- `/` → HomePage (dashboard overview)
- `/debts` → DebtsPage (add/edit/delete debts, pie chart with legend)
- `/budget` → BudgetPage (income sources, expenses, debt allocation, strategy)
- `/plan` → PlanPage (view generated payoff schedule)
- `/track` → TrackPage (mark payments, view history)
- `/settings` → SettingsPage (themes, categories, data management)
- `/strategy` → StrategyPage (legacy, Budget page preferred)

## Key Patterns

- **Type imports:** Use `import type { Debt }` for type-only imports
- **State access:** Call `useApp()` hook (component must be inside `<AppProvider>`)
- **Expensive calculations:** Wrap with `useMemo` (see payoff plan generation)
- **Dates:** Stored as ISO strings, use date-fns for display formatting
- **IDs:** Generated with `uuid` package
- **Mobile-first:** Bottom navigation, touch-friendly targets

## Files to Modify for Common Tasks

| Task | Files |
|------|-------|
| Add debt field | `types/index.ts`, `DebtModal.tsx`, `DebtsPage.tsx` |
| Modify payoff calculations | `lib/calculations.ts` |
| Change theme colors | `lib/themes.ts` (presets), `index.css` (CSS variables) |
| Add new theme preset | `lib/themes.ts` (THEME_PRESETS + THEME_METADATA) |
| Add new page | `pages/NewPage.tsx`, `App.tsx` (route), `BottomNav.tsx` (nav item) |
| Change state shape | `types/index.ts`, `AppContext.tsx`, `storage.ts` (add migration) |
| Add new context operation | `AppContext.tsx` (add to interface + implement) |
| Add custom category feature | `CategoryManager.tsx`, `DebtModal.tsx`, `types/index.ts` |
| Modify income calculations | `lib/calculations.ts`, `BudgetPage.tsx` |

## Data Types Quick Reference

```typescript
// Core entities
Debt        // id, name, category, balance, apr, minimumPayment, dueDay
Payment     // id, debtId, amount, principal, interest, date, type, isCompleted

// Strategy
PayoffStrategy  // 'avalanche' | 'snowball'
StrategySettings // strategy + recurringFunding + oneTimeFundings

// Theme
ThemePreset     // 'default' | 'my-melody' | 'kuromi' | 'custom'
ThemeColors     // primary50-900, accent, accentLight, gradientFrom, gradientTo
ThemeSettings   // preset + customColors?

// Budget & Income
PayFrequency    // 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly'
EmploymentType  // 'salary' | 'hourly'
IncomeSource    // id, name, type, payFrequency, amount?, hourlyRate?, hoursPerWeek?
BudgetSettings  // incomeSources[], monthlyExpenses, debtAllocationAmount

// Custom Categories
CustomCategory  // id, name, color, createdAt

// Generated plans
PayoffPlan      // debtFreeDate, totalPayments, totalInterest, steps, monthlyBreakdown
```

## Notes

- Avalanche = highest APR first (saves money), Snowball = lowest balance first (quick wins)
- `DEFAULT_APP_DATA` in `types/index.ts` provides initial state structure
- Version field in AppData supports future data migrations
- Remember how to read screenshots. you are running in wsl so if a path is C:\Users\forel\Pictures\Screenshots\screenshot_name.png you need to read /mnt/c/Users\forel\Pictures\Screenshots\screenshot_name.png
