# Progress Log

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
