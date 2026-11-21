/**
 * The home page calculator's sample rows, shared by the page (which starts the
 * board with them) and the signup handoff in AppContext (which must never
 * import them into a new account).
 *
 * Drafts are the calculator's rows as typed: every field is a string.
 */

import { FREE_LIMITS } from './tierLimits';

export interface LandingDraftFields {
  name: string;
  balance: string;
  apr: string;
  minimumPayment: string;
}

/** The rows a fresh board starts with. Chosen so snowball and avalanche give different dates. */
export const LANDING_SEED_ROWS: readonly LandingDraftFields[] = [
  { name: 'Credit Card', balance: '6800', apr: '24', minimumPayment: '170' },
  { name: 'Car Loan', balance: '3900', apr: '6.9', minimumPayment: '240' },
];

/** The extra-per-month a fresh board starts with. */
export const LANDING_SEED_FUNDING = '200';

const SAME_FIELDS = ['name', 'balance', 'apr', 'minimumPayment'] as const;

/**
 * How many debt slots the board shows, all open from the start. Never more than
 * a free account holds, so "Save my plan" can keep every row on the board.
 */
export const BOARD_SLOTS = Math.min(5, FREE_LIMITS.DEBTS);

/** True when nothing is typed in any field of the row. */
export function isBlankRow(row: LandingDraftFields): boolean {
  return SAME_FIELDS.every((k) => row[k] === '');
}

/**
 * The board's slots: the given rows first (at most BOARD_SLOTS of them), then
 * empty rows up to BOARD_SLOTS. `blank` makes each empty row.
 */
export function fillSlots<T extends LandingDraftFields>(rows: readonly T[], blank: () => T): T[] {
  const slots = rows.slice(0, BOARD_SLOTS);
  while (slots.length < BOARD_SLOTS) slots.push(blank());
  return slots;
}

/** True while the sample rows sit untouched in the first slots and every other slot is empty. */
export function holdsOnlySample(rows: readonly LandingDraftFields[]): boolean {
  return (
    rows.length >= LANDING_SEED_ROWS.length &&
    rows.every((row, i) =>
      i < LANDING_SEED_ROWS.length ? SAME_FIELDS.every((k) => row[k] === LANDING_SEED_ROWS[i][k]) : isBlankRow(row),
    )
  );
}

/** True when a row is one of the sample rows exactly, field for field. */
export function isSampleRow(row: LandingDraftFields): boolean {
  return LANDING_SEED_ROWS.some((seed) => SAME_FIELDS.every((k) => row[k] === seed[k]));
}

/**
 * The rows a visitor typed or edited, without the untouched sample rows, so
 * signing up never turns the examples into someone's real debts. Matched per
 * row: a row identical to a sample row is skipped, everything else is kept.
 */
export function withoutSampleRows<T extends LandingDraftFields>(rows: readonly T[]): T[] {
  return rows.filter((row) => !isSampleRow(row));
}
