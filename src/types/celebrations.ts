/**
 * Celebration Feature Types
 *
 * Types for the milestone celebration system — fires when users hit
 * debt payoff milestones (25%, 50%, 75%, individual debt paid off, debt free).
 */

export type MilestoneType =
  | 'progress_25'
  | 'progress_50'
  | 'progress_75'
  | 'debt_free'
  | 'debt_paid_off'
  | 'interest_500'
  | 'interest_1000'
  | 'interest_5000'
  | 'streak_3'
  | 'streak_6'
  | 'first_payment';

export interface MilestoneEvent {
  type: MilestoneType;
  /** true only for debt_paid_off and debt_free — shows full herd */
  isFullHerd: boolean;
  headline: string;
  subtext: string;
  /** only populated for debt_paid_off */
  debtName?: string;
  debtId?: string;
}

export interface CelebrationStats {
  userName: string;
  totalOriginal: number;
  totalPaid: number;
  percentPaid: number;
  interestSaved: number;
  debtFreeDate: string;
  paidOffDebtName?: string;
}
