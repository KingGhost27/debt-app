/**
 * Purchase guards shared by create-checkout and the Stripe webhook.
 *
 * Import-free on purpose: the rule in `hasActivePro` mirrors
 * `resolveEntitlement` in src/lib/entitlement.ts, and
 * tests/purchase-guard.test.ts fails if the two ever disagree.
 */

export interface SubscriptionRowLike {
  plan_type: string | null;
  status: string | null;
  current_period_end: string | null;
  stripe_subscription_id?: string | null;
}

/** True when this row already grants Pro (same rule the app uses to unlock Pro). */
export function hasActivePro(
  row: SubscriptionRowLike | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!row) return false;
  const isActive = row.status === 'active' || row.status === 'trialing';
  const isLifetime = row.plan_type === 'lifetime';
  const notExpired =
    isLifetime || !row.current_period_end || new Date(row.current_period_end) > now;
  return isActive && notExpired;
}

export type CheckoutWriteDecision =
  /** Write the new purchase to the row. */
  | { action: 'write'; orphanedSubscriptionId: string | null }
  /** Leave the row alone: it already holds an active lifetime plan. */
  | { action: 'keep-lifetime' };

/**
 * What a completed checkout may do to the buyer's existing row.
 *
 * An active lifetime plan is never replaced, whatever was just bought; the
 * duplicate payment needs a manual refund. Any other existing plan is replaced
 * by the new purchase, and if that drops a different subscription that was not
 * canceled, the caller gets its id back so it can be logged. That includes
 * past_due and stale rows: they no longer grant Pro, but Stripe may still
 * collect on them.
 */
export function decideCheckoutWrite(
  existing: SubscriptionRowLike | null | undefined,
  newSubscriptionId: string | null,
  now: Date = new Date(),
): CheckoutWriteDecision {
  if (existing?.plan_type === 'lifetime' && hasActivePro(existing, now)) {
    return { action: 'keep-lifetime' };
  }

  const previousId = existing?.stripe_subscription_id ?? null;
  const orphaned =
    previousId && previousId !== newSubscriptionId && existing?.status !== 'canceled'
      ? previousId
      : null;

  return { action: 'write', orphanedSubscriptionId: orphaned };
}
