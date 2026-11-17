/**
 * How Stripe's word becomes a row in user_subscriptions.
 *
 * Import-free on purpose, like purchase-guard.ts: tests load it without Stripe
 * or Supabase, and the cancel path below takes its Stripe calls as arguments.
 */

/** The values the `status` check constraint on user_subscriptions allows. */
export type RowStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';

/**
 * Stripe's subscription status as the row stores it.
 *
 * A status this code has never seen becomes `incomplete`, which does not grant
 * Pro. Guessing `active` would hand out Pro on a state nobody has read about.
 */
export function rowStatusFor(stripeStatus: string | null | undefined): RowStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'incomplete':
      return 'incomplete';
    case 'canceled':
    case 'incomplete_expired':
    case 'paused':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

/** False for a status `rowStatusFor` had to guess at, so the caller can log it. */
export function isKnownSubscriptionStatus(stripeStatus: string | null | undefined): boolean {
  return (
    stripeStatus === 'active' ||
    stripeStatus === 'trialing' ||
    stripeStatus === 'past_due' ||
    stripeStatus === 'unpaid' ||
    stripeStatus === 'incomplete' ||
    stripeStatus === 'canceled' ||
    stripeStatus === 'incomplete_expired' ||
    stripeStatus === 'paused'
  );
}

/**
 * A renewal charge failed and the money has not arrived.
 *
 * Policy: the membership ends here and the customer starts a new one when they
 * are ready. That keeps one subscription per customer and means nobody is
 * charged by a retry days after the app already showed them the Free plan.
 */
export function endsForNonPayment(stripeStatus: string | null | undefined): boolean {
  return stripeStatus === 'past_due' || stripeStatus === 'unpaid';
}

/** One-time purchases (lifetime): has the money actually landed? */
export function checkoutIsPaid(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === 'paid' || paymentStatus === 'no_payment_required';
}

export type CheckoutReading =
  | { write: true; status: RowStatus }
  | { write: false; reason: 'unpaid' | 'no-subscription' | 'subscription-ended' };

/**
 * What a completed checkout may write, going only by what Stripe reports.
 *
 * Lifetime is a one-time payment, so the session's payment status decides.
 * Monthly and annual go by the status of the subscription the session created.
 * A subscription Stripe already reports as ended means the event is an old
 * one: writing it would put a dead plan over whatever the customer has now.
 */
export function readCheckout(purchase: {
  isLifetime: boolean;
  paymentStatus?: string | null;
  /** Status of the session's subscription as retrieved; null when it has none. */
  subscriptionStatus?: string | null;
}): CheckoutReading {
  if (purchase.isLifetime) {
    return checkoutIsPaid(purchase.paymentStatus)
      ? { write: true, status: 'active' }
      : { write: false, reason: 'unpaid' };
  }
  if (purchase.subscriptionStatus == null) {
    return { write: false, reason: 'no-subscription' };
  }
  const status = rowStatusFor(purchase.subscriptionStatus);
  return status === 'canceled'
    ? { write: false, reason: 'subscription-ended' }
    : { write: true, status };
}

export interface SubscriptionSnapshot {
  id: string;
  status: string;
}

/** The three Stripe calls the non-payment path needs. */
export interface StripeSide<S extends SubscriptionSnapshot> {
  /** The subscription as Stripe has it right now. */
  retrieve(subscriptionId: string): Promise<S>;
  /** Cancel immediately, no proration. */
  cancel(subscriptionId: string): Promise<unknown>;
  /** Void every open invoice of this subscription. */
  voidOpenInvoices(subscriptionId: string): Promise<unknown>;
}

export interface SettledUpdate<S extends SubscriptionSnapshot> {
  /** The subscription to write from: the event's copy, or Stripe's fresh one. */
  subscription: S;
  /** True when the membership is over for non-payment; write the row `canceled`. */
  endedForNonPayment: boolean;
}

/**
 * Decide what a `customer.subscription.updated` event means, ending the
 * subscription in Stripe when a renewal went unpaid.
 *
 * The event is a snapshot and can arrive late or twice, so an unpaid status is
 * re-read from Stripe before anything is canceled. Every step is safe to
 * repeat, and any Stripe error is left to reject: the webhook then answers 500
 * and Stripe delivers the event again.
 */
export async function settleSubscriptionUpdate<S extends SubscriptionSnapshot>(
  fromEvent: S,
  stripeSide: StripeSide<S>,
): Promise<SettledUpdate<S>> {
  if (!endsForNonPayment(fromEvent.status)) {
    return { subscription: fromEvent, endedForNonPayment: false };
  }

  const current = await stripeSide.retrieve(fromEvent.id);
  const alreadyCanceled = current.status === 'canceled';

  if (!alreadyCanceled && !endsForNonPayment(current.status)) {
    // A retry collected after this event was created. Nothing to end.
    return { subscription: current, endedForNonPayment: false };
  }

  if (!alreadyCanceled) {
    await stripeSide.cancel(current.id);
  }
  // Canceling only stops automatic collection. An open invoice could still be
  // paid by hand, charging the customer for a membership that no longer exists.
  await stripeSide.voidOpenInvoices(current.id);

  return { subscription: current, endedForNonPayment: true };
}
