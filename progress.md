# Progress Log

## Session: February 5, 2026

### Branch: `feature/paycheck-tracking`

---

### Changes Made

#### 1. UI Dark Mode Cleanup (Day Mode Fixes)
- Removed all `dark:` variant classes from multiple components for consistent day mode appearance
- Fixed pages: SubscriptionsPage, PlanPage, TrackPage
- Fixed components: SubscriptionModal, IncomeSourceModal, UpcomingBills, PayoffSteps, PlanSummary, BudgetSidebar, AssetModal

#### 2. Modal Window Sizing Fixes
- Fixed SubscriptionModal and IncomeSourceModal cutting off at bottom
- Added `max-h-[75vh] sm:max-h-[85vh]` with proper overflow handling
- Added bottom padding (`pb-20`) to prevent overlap with bottom navigation

#### 3. Text Visibility Fixes (Home Page Bills Section)
- Changed text colors in UpcomingBills from `gray-900` to `primary-700/800`
- Better contrast against pink theme backgrounds

#### 4. Debts Page Sorting
- Changed "By Debt" chart view to sort by balance (highest to lowest) instead of grouping by category

#### 5. Assets Page Money Celebration Animation
- Added floating money emojis (💰💵🪙💎✨⭐) when net worth is positive
- Added money shower animation in center with all currency emojis (💵💴💶💷💰💸🪙🤑💎🏦💳🏧💹)
- Added "You're in the green!" message
- New CSS animations: `money-float`, `money-pop`, `money-shower`, `money-bounce-fall`

#### 6. Calendar Subscriptions Integration
- Added subscriptions to MiniCalendar component in Track page
- Subscriptions show as purple tags with ↻ icon in large calendar view
- Purple ↻ badge indicator in small calendar view
- Subscriptions included in day tooltips with category colors
- Added legend entry for subscriptions

#### 7. Paycheck Summary on Home Page
- Added paycheck summary card near top of Home page
- Shows: received amount, bills + subs total, remaining balance
- Displays pay period date range
- Links to Track page for full details
- Styled with theme colors (primary gradient)

#### 8. Strategy Comparison Animation
- Added "Best Value!" badge with crown icon for strategy that saves most money
- Badge has bounce animation, wiggling crown, and pulsing sparkles
- Golden ring highlight around the winning strategy button
- Floating ✨ and 💰 emojis around best strategy

#### 9. Strategy Comparison Theme Colors
- Changed Avalanche/Snowball buttons from blue/purple to theme primary colors
- Avalanche uses darker shade (primary-500/600), Snowball uses lighter (primary-400/500)
- Bottom callout updated to use primary color gradients

#### 10. Profile Name Setting
- Added Profile section to Settings page
- User can enter their name with save button
- Name displays in Home page greeting ("Hi, [name]!")
- Shows confirmation toast when saved

---

### Files Created
- None (all changes to existing files)

### Files Modified
- `src/pages/SubscriptionsPage.tsx` - Removed dark: classes
- `src/components/ui/SubscriptionModal.tsx` - Dark mode cleanup, window sizing fix
- `src/pages/PlanPage.tsx` - Removed dark: classes
- `src/components/plan/BudgetSidebar.tsx` - Removed dark: classes
- `src/components/plan/PlanSummary.tsx` - Theme colors, best strategy animation
- `src/components/plan/PayoffSteps.tsx` - Removed dark: classes
- `src/components/ui/IncomeSourceModal.tsx` - Dark mode cleanup, window sizing fix
- `src/pages/TrackPage.tsx` - Removed dark: classes, pass subscriptions to calendar
- `src/components/ui/PayPeriodSummary.tsx` - Added remaining unpaid bills total
- `src/components/ui/UpcomingBills.tsx` - Text visibility fixes
- `src/pages/DebtsPage.tsx` - Sort debts by balance in chart
- `src/pages/AssetsPage.tsx` - Money celebration animation
- `src/index.css` - Money animation keyframes and classes
- `src/components/ui/MiniCalendar.tsx` - Subscriptions integration
- `src/pages/HomePage.tsx` - Paycheck summary card
- `src/pages/SettingsPage.tsx` - Profile name input

---

### Git Commits (this session)
1. `[UI] Fix text visibility in Bills section on Home page`
2. `[UI] Sort debts by balance (highest to lowest) in By Debt chart view`
3. `[UI] Add floating money celebration for positive net worth`
4. `[UI] Add money shower animation with all currency emojis`
5. `[Feature] Add subscriptions to calendar in Track page`
6. `[Feature] Add paycheck summary card to Home page`
7. `[UI] Update paycheck summary card to use theme colors`
8. `[UI] Add cute animation to best strategy in comparison`
9. `[UI] Update strategy comparison colors to match theme`
10. `[Feature] Add profile name setting to Settings page`
11. `[UI] Remove remaining dark mode classes from modals`

---

---

## Session: February 4, 2026

### Branch: `feature/kawaii-redesign`

---

### Changes Made

#### 1. Subscription Tracking Feature (Complete)
- **New Page**: `src/pages/SubscriptionsPage.tsx`
  - Summary card with monthly/annual totals
  - Subscriptions grouped by category
  - Pause/resume functionality
  - Custom billing frequencies (days/weeks/months/years)
- **New Component**: `src/components/ui/SubscriptionModal.tsx`
  - Form fields: name, amount, frequency, next billing date, category
  - Kawaii gradient header styling
- **New Types**: `Subscription`, `SubscriptionFrequency`, `SubscriptionCategory`
- **Context Methods**: `addSubscription`, `updateSubscription`, `deleteSubscription`
- **Storage Migration**: v1.2.0 → v1.3.0 for subscriptions array

#### 2. Pay Period Bills Integration
- **UpcomingBills Component**: Combined debts and subscriptions in pay period view
- Pay period navigation (previous/next buttons)
- Shows date range for each pay period
- "Sub" badge for subscription items vs debt items

#### 3. Bottom Navigation Updates
- Added Settings button for quick access
- Added Subs (Subscriptions) nav item

#### 4. HomePage Light Mode Fixes
- **Up Next Card**: Updated to use theme gradient (primary-600 → 400 → 200)
- **Savings Callout**: Matches same gradient style
- Added decorative circles and frosted glass icons
- Fixed dark/gray overlay issue in light mode

#### 5. AssetModal Fix
- Added bottom margin to prevent cutoff by bottom navigation
- Applied kawaii styling (gradient header, PiggyBank icon)

---

### Files Created
- `src/pages/SubscriptionsPage.tsx` - Subscription tracking page
- `src/components/ui/SubscriptionModal.tsx` - Add/edit subscription modal

### Files Modified
- `src/types/index.ts` - Subscription types and category info
- `src/context/AppContext.tsx` - Subscription CRUD operations
- `src/lib/storage.ts` - Migration for subscriptions
- `src/App.tsx` - Added subscriptions route
- `src/components/layout/BottomNav.tsx` - Added Settings and Subs nav items
- `src/components/ui/UpcomingBills.tsx` - Pay period navigation, subscription integration
- `src/components/ui/AssetModal.tsx` - Bottom margin fix, kawaii styling
- `src/pages/HomePage.tsx` - Up Next and Savings card gradient styling

---

### Git Commits (this session)
1. `[Feature] Add pay period view to Upcoming Bills`
2. `[Feature] Add pay period navigation`
3. `[Fix] AssetModal cut off by bottom nav + kawaii styling`
4. `[Feature] Add subscription tracking page`
5. `[UI] Add Settings to bottom navigation`
6. `[UI] Update Up Next and Savings cards with theme gradient styling`

---

### Subscription Feature Status
- [x] Types and data model
- [x] Context CRUD operations
- [x] Storage migration
- [x] SubscriptionModal component
- [x] SubscriptionsPage with categories
- [x] Route and navigation
- [x] Integration with pay period bills view

---

---

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
