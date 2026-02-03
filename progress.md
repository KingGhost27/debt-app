# Progress Log

## Session: February 2, 2026

### Branch: `feature/polish-items`

---

### Changes Made

#### 1. StrategyPage Cleanup
- Removed non-functional frequency button (now plain text)
- Changed one-time fundings section to link to Plan page

#### 2. Toast Notification System
- **New Component**: `src/components/ui/Toast.tsx`
  - Success (green), error (red), warning (amber), info (blue) variants
  - Auto-dismiss after 4 seconds
  - Slide-up animation
- **ToastProvider**: Wraps app for global access via `useToast()` hook
- Replaced all `alert()` calls:
  - SettingsPage: import success/error
  - CategoryManager: deletion warning

#### 3. Improved Empty States
- **New Component**: `src/components/ui/EmptyState.tsx`
  - Reusable with icon, title, description, action props
- **DebtsPage**: CreditCard icon, better messaging
- **TrackPage**:
  - No debts: CreditCard icon
  - No upcoming: Calendar icon with "Set Up Budget" CTA
  - No completed: Receipt icon

---

### Files Created
- `src/components/ui/Toast.tsx` - Toast notification system
- `src/components/ui/EmptyState.tsx` - Reusable empty state component

### Files Modified
- `src/pages/StrategyPage.tsx` - Removed dead buttons
- `src/App.tsx` - Added ToastProvider
- `src/index.css` - Added slide-up animation
- `src/pages/SettingsPage.tsx` - Uses toast instead of alert
- `src/components/ui/CategoryManager.tsx` - Uses toast instead of alert
- `src/pages/DebtsPage.tsx` - Uses EmptyState component
- `src/pages/TrackPage.tsx` - Uses EmptyState component

---

### Git Commits (this session)
1. `[UI] Remove dead buttons from StrategyPage`
2. `[Feature] Add toast notification system`
3. `[UI] Improve empty states with consistent styling`

---

### Polish Items Status
- [x] Toast notifications (replaced all alert() calls)
- [x] Remove dead buttons in StrategyPage
- [x] Improve empty states

---

---

## Session: February 1, 2026

### Branch: `main` (merged from `feature/plan-page-restructure`)

---

### Changes Made

#### 1. Dark Mode Toggle & Styling
- **New Feature**: Complete dark mode support
- **ThemeSelector**: Added sun/moon toggle in Settings page
- **useTheme hook**: Added `isDarkMode`, `toggleDarkMode`, `setDarkMode`
- **CSS Overrides**: Comprehensive dark mode styles in `index.css`:
  - Background colors (gray scale inversions)
  - Text colors (inverted for readability)
  - Border colors, shadows, hover states
  - Form inputs, gradients, dividers
  - Colored backgrounds (red, green, amber, blue, purple)
  - Primary color adjustments using `color-mix()`

#### 2. PayoffSteps Redesign
- **Removed**: Collapsible monthly details accordion (too much info)
- **Added**: Visual progress bars for each step:
  - "Paid this step" amount
  - Progress bar showing step completion %
  - Remaining balance indicator
  - "X% of journey" overall progress
  - Month count for each step
- **Removed**: Timeline connector line between steps (cleaner look)

#### 3. Plan Page Improvements
- **Debt-Free Countdown Card**: Added under strategy comparison
  - Shows time remaining (e.g., "1 year, 8 months")
  - Target date and total interest
- **Budget Sidebar Redesign**: Clearer flow
  - "What you have" section (income - expenses = available)
  - Minimum payments shown as non-editable info
  - Single input: "Extra payment" (the one thing user controls)
  - Total monthly payment summary at bottom

#### 4. One-Time Fundings Feature (Complete Implementation)
- **New Component**: `OneTimeFundingModal.tsx`
  - Quick-select presets (Tax Refund, Work Bonus, Gift, etc.)
  - Name, amount, expected date fields
  - Info box explaining how fundings work
- **Context Methods**: `addOneTimeFunding`, `updateOneTimeFunding`, `deleteOneTimeFunding`
- **BudgetSidebar Integration**:
  - Add/edit/delete fundings
  - List with name, date, amount
  - "Applied" badge for used fundings
  - Total upcoming amount
- **Payoff Calculations**: Fundings applied as extra payment in scheduled month

---

### Files Created
- `src/components/ui/OneTimeFundingModal.tsx` - One-time funding form modal

### Files Modified
- `src/index.css` - Dark mode CSS overrides
- `src/lib/themes.ts` - Dark mode gradient handling
- `src/hooks/useTheme.ts` - Dark mode state and toggle
- `src/components/ui/ThemeSelector.tsx` - Dark mode toggle UI
- `src/types/index.ts` - Added `darkMode` to ThemeSettings
- `src/components/plan/PayoffSteps.tsx` - Visual progress bars
- `src/pages/PlanPage.tsx` - Debt-free countdown, imports
- `src/components/plan/BudgetSidebar.tsx` - Redesigned budget flow, one-time fundings list
- `src/context/AppContext.tsx` - One-time funding CRUD methods
- `src/lib/calculations.ts` - One-time fundings in payoff calculation
- `CLAUDE.md` - Updated documentation

---

### Git Commits (this session)
1. `[Feature] Add dark mode toggle and styling`
2. `[Feature] Add collapsible monthly details to PayoffSteps`
3. `[Docs] Update CLAUDE.md with current app structure`
4. `[Refactor] Simplify PayoffSteps with visual progress bars`
5. `[Style] Remove timeline connector line from PayoffSteps`
6. `[UI] Improve Plan page budget section and add countdown`
7. `[Feature] Add complete one-time fundings functionality`

---

### Polish Items Identified
- [x] One-time fundings (was non-functional, now complete)
- [ ] Toast notifications (Settings uses alert())
- [ ] Remove dead buttons in StrategyPage
- [ ] Improve empty states

---

---

## Session: January 30, 2026

### Branch: `feature/plan-page-restructure`

---

### Changes Made

#### 1. Fixed Strategy Comparison Text (PlanSummary.tsx)
- **Problem**: When clicking on Snowball, the text said "Switching to Avalanche..." which was confusing
- **Solution**: Changed the callout to describe the currently selected strategy:
  - **Avalanche**: "pays off highest interest debts first, saving you the most money."
  - **Snowball**: "pays off smallest balances first, giving you quick wins to stay motivated."
- Added interest savings/cost comparison (e.g., "You'll save $X in interest vs Snowball")
- Added total paid comparison (e.g., "Total paid: $X ($Y less)")

#### 2. Added Debt Over Time Line Chart (HomePage)
- **New Component**: `src/components/ui/DebtOverTimeChart.tsx`
- Uses Recharts (LineChart) to visualize debt balance decreasing over time
- Shows starting balance ("Now") and projects through payoff completion
- X-axis: months, Y-axis: balance in $k format
- Tooltip shows exact balance on hover

#### 3. Added "Up Next" Section (HomePage)
- Shows the next debt to be paid off (single card, not full list)
- Displays debt name and projected payoff date
- Shows balance left to pay off on the right side
- Placed at the top of main content for easy visibility
- Uses Target icon with primary color styling

#### 4. Enhanced Debts Page with New Visualizations
- **APR Comparison Chart**: Horizontal bar chart showing each debt's APR
  - Color-coded by risk level (green <10%, amber 10-20%, red >20%)
  - Help tooltip explaining what APR means
- **Monthly Interest Cost Card**: Shows total interest accruing per month
  - Includes daily and yearly breakdowns
- **Payoff Timeline**: Visual timeline showing when each debt gets paid off
  - Numbered dots with debt names and dates
  - Ends with "Debt Free!" checkmark

#### 5. Major Track Page Enhancements
- **"This Month" Summary Card**: Shows paid/remaining/on-track status
- **Payment Streak Tracking**: Gamification with milestone badges (1mo, 3mo, 6mo, 1yr)
- **"Mark as Paid" Buttons**: Checkmark buttons on upcoming payments
- **Payment Modal**: New component for logging manual payments
  - Quick-amount buttons (Minimum, 2x Min, +$50, +$100)
  - Debt selector, date picker, payment type
- **Undo/Delete Payments**: Can undo marked payments or delete from history
- **Auto-Update Balances**: Marking payment as paid reduces debt balance automatically

#### 6. Enhanced Calendar (MiniCalendar)
- **Size Prop**: Added 'small' | 'large' option
- **Large Calendar**: Shows bill names directly in day cells
  - Taller cells with room for content
  - Shows up to 2 bills per day with "+X more"
  - Payday shown as "💰 Payday" pill
  - Pay cycle end shown as "📅 Cycle ends" pill
- **Full Week Day Names**: Shows "Sun, Mon, Tue..." in large mode

#### 7. Bill Distribution Analysis (NEW!)
- **New File**: `src/lib/billDistribution.ts`
  - Analyzes pay periods based on income sources
  - Assigns bills to pay periods
  - Calculates balance score (0-100)
  - Generates suggestions to rebalance
- **New Component**: `src/components/ui/BillDistributionPanel.tsx`
  - Shows pay period breakdown with visual bars
  - Color-coded: red (heavy), green (balanced), blue (light)
  - Lists bills in each period
  - Suggested due date changes with explanations
  - "Apply" buttons to change dates individually or all at once
- **Location**: Track page → Calendar tab

---

### Files Created
- `src/components/ui/DebtOverTimeChart.tsx` - Debt payoff line chart
- `src/components/ui/PaymentModal.tsx` - Manual payment logging modal
- `src/lib/billDistribution.ts` - Bill distribution analysis algorithms
- `src/components/ui/BillDistributionPanel.tsx` - Distribution analysis UI

### Files Modified
- `src/components/plan/PlanSummary.tsx` - Strategy comparison text fixes
- `src/pages/HomePage.tsx` - DebtOverTimeChart, Up Next section, enhanced Payoff Progress
- `src/pages/DebtsPage.tsx` - APR chart, monthly interest, payoff timeline
- `src/pages/TrackPage.tsx` - This Month card, streaks, mark as paid, calendar integration
- `src/components/ui/MiniCalendar.tsx` - Size prop, inline bill names
- `src/types/index.ts` - Added nextPayDate, payCycleEndDate to IncomeSource
- `src/lib/calculations.ts` - Added getPaydaysInMonth, getPayCycleEndsInMonth, formatOrdinal
- `src/components/ui/IncomeSourceModal.tsx` - Added payday/cycle end date inputs

---

### Git Commits (this session)
1. `[Feature] Add APR chart, monthly interest, and payoff timeline to DebtsPage`
2. `[Feature] Add help tooltip to APR Comparison section`
3. `[Feature] Major Track page enhancements with auto-balance updates`
4. `[Feature] Larger calendar with bills due list`
5. `[Feature] Show bill names directly on calendar cells`
6. `[Feature] Add bill distribution analysis with due date suggestions`

---

### Next Steps
- [ ] Test all features on mobile view
- [ ] Consider adding notifications for upcoming bills
- [ ] Add payment history export
