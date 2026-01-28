# Progress Log

## Session: January 26, 2026

### Accomplishments

#### Theme System (My Melody & Kuromi)
- Created `src/lib/themes.ts` with preset color palettes:
  - **My Melody**: Soft pink (#ff4d6d) with white accents
  - **Kuromi**: Purple (#8b5cf6) with lavender accents
  - **Default**: Original teal/cyan theme
- Created `src/hooks/useTheme.ts` for theme management
- Updated `src/index.css` with CSS variables for dynamic theming
- Themes apply instantly without page reload

#### Custom Categories
- Added custom category support in `src/types/index.ts`
- Created `src/components/ui/CategoryManager.tsx` for CRUD operations
- Updated `DebtModal.tsx` with inline category creation (color picker + name)
- Categories persist in localStorage with data migration support

#### Budget Page (Replaces Strategy)
- Created `src/pages/BudgetPage.tsx` with:
  - Income Sources section (salary/hourly with pay frequency)
  - Monthly Expenses tracking
  - Available for Debt calculation
  - Debt allocation amount input
  - Avalanche/Snowball strategy selector
- Created `src/components/ui/IncomeSourceModal.tsx` for income CRUD
- Added income calculation helpers in `calculations.ts`

#### Settings Page
- Created `src/pages/SettingsPage.tsx` with:
  - Theme picker using `ThemeSelector` component
  - Category manager for custom categories
  - Data management (export/import/clear)
- Created `src/components/ui/ThemeSelector.tsx` for theme cards

#### Debts Page Improvements
- **Pie Chart Enhanced Legend**: Now shows name + amount + progress bar
- **Unique Colors**: Each debt gets distinct color in "By Debt" view (15-color palette)
- **Removed 6-item limit**: All items visible with scrolling
- Added `formatCompactCurrency()` for large amounts in chart center

#### HomePage Fixes
- **Fixed credit utilization overlap**: Added `showLabel={false}` to ProgressRing
- **Fixed missing Summary values**: Added explicit `text-gray-900` color classes
- **Added conditional styling**: Red text when utilization > 100%

#### Routing & Navigation
- Updated `BottomNav.tsx`: Strategy → Budget (Wallet icon)
- Added `/budget` and `/settings` routes in `App.tsx`
- HomePage settings gear links to Settings page

#### Data Migration
- Added v1.0.0 → v1.1.0 migration in `storage.ts`
- Migrates existing data to include theme, customCategories, and budget fields

### Files Created
| File | Purpose |
|------|---------|
| `src/lib/themes.ts` | Theme presets and applyTheme() function |
| `src/hooks/useTheme.ts` | Theme management hook |
| `src/pages/BudgetPage.tsx` | Income & Budget management |
| `src/pages/SettingsPage.tsx` | App settings with themes |
| `src/components/ui/ThemeSelector.tsx` | Theme picker cards |
| `src/components/ui/CategoryManager.tsx` | Category CRUD |
| `src/components/ui/IncomeSourceModal.tsx` | Income source form |

### Files Modified
- `src/types/index.ts` - Added theme, category, income, budget types
- `src/context/AppContext.tsx` - Added theme, category, budget operations
- `src/lib/storage.ts` - Added data migration
- `src/lib/calculations.ts` - Added income and formatting helpers
- `src/pages/DebtsPage.tsx` - Enhanced pie chart and legend
- `src/pages/HomePage.tsx` - Fixed UI bugs
- `src/components/ui/DebtModal.tsx` - Custom category creation
- `src/index.css` - CSS variable theming
- `src/App.tsx` - New routes
- `src/components/layout/BottomNav.tsx` - Budget nav item

### Git Commit
- **Commit:** `e104796`
- **Message:** "Add theme system, custom categories, Budget page, and UI improvements"
- **Stats:** 22 files changed, 2,238 insertions(+), 89 deletions(-)

---

## Session: January 27, 2026

### Accomplishments

#### Donut Chart Fix (DebtsPage)
- **Fixed SVG rendering bug**: `strokeDasharray` was using percentages (out of 100) instead of actual circle circumference (`2π × r ≈ 251.3`), causing slices to overlap and scatter
- **Grouped "By Debt" slices by category**: Same-category debts now appear adjacent in the chart, sorted by category then balance
- **Updated category colors** for better visual distinction:
  - Student Loan: green → amber (`#f59e0b`)
  - Personal Loan: amber → green (`#22c55e`)
  - Auto Loan: cyan → blue (`#3b82f6`)

#### Plan Page Inline Contribution Editor
- Added editable monthly contribution amount directly on the Plan page
- Tap pencil icon to switch to inline input, checkmark to save
- Updates `strategy.recurringFunding.amount` so the plan recalculates immediately
- Displays current strategy (Avalanche/Snowball) for context

### Files Modified
- `src/pages/DebtsPage.tsx` - Fixed donut chart circumference math, grouped slices by category
- `src/types/index.ts` - Updated category colors for better contrast
- `src/pages/PlanPage.tsx` - Added inline extra contribution editor

### Git Commits
- **`1f0c9ef`** - [Fix] Fix donut chart rendering and group slices by category
- **`ac47d68`** - [Feature] Add inline extra contribution editor to Plan page

---

## Session: January 28, 2026

### Accomplishments

#### Legend Scrollbar Fix (DebtsPage)
- Added `pr-4` padding to legend scroll container to prevent scrollbar from overlapping dollar amounts

#### Merged Budget + Plan Pages
- **Unified `/plan` page** now handles both budget configuration and payoff plan visualization
- **Deleted `BudgetPage.tsx`** — all functionality moved into PlanPage
- **Removed `/budget` route** from App.tsx
- **Updated BottomNav** from 5 to 4 items (Home, Debts, Plan, Track)

#### Plan Page Redesign
- **Plan Summary card** now includes Avalanche/Snowball toggle buttons in the header
- **Collapsible "Budget Details" section** containing:
  - Income Sources (add/edit/delete via modal)
  - Monthly Expenses input
  - Available for Debt breakdown
  - Debt allocation amount input
  - One-time Fundings display
  - Strategy comparison info
- **Income breakdown formula** displayed: `income − minimums − expenses = available`
- Budget Details auto-expands when no allocation is set
- Removed inline monthly contribution editor (simplified UI)

#### Bug Fixes
- Fixed dead `/strategy` link in PlanPage empty state
- Fixed `isLastStep` variable bug (was referencing module-level constant instead of loop variable)
- Synced `budget.debtAllocationAmount` with `strategy.recurringFunding.amount` when editing

### Files Deleted
| File | Reason |
|------|--------|
| `src/pages/BudgetPage.tsx` | Merged into PlanPage |

### Files Modified
- `src/pages/PlanPage.tsx` - Major refactor: merged budget functionality, redesigned layout
- `src/pages/DebtsPage.tsx` - Added padding to fix scrollbar overlap
- `src/pages/index.ts` - Removed BudgetPage export
- `src/App.tsx` - Removed `/budget` route and BudgetPage import
- `src/components/layout/BottomNav.tsx` - Removed Budget nav item (5 → 4 items)

### Git Commits
- **`6ae4fd9`** - [Fix] Add padding to legend scroll container to prevent scrollbar overlap
- **`2000d2e`** - [Feature] Merge Budget and Plan pages into unified Plan page
