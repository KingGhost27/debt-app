import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasActivePro } from '../api/_lib/purchase-guard';
import {
  checkoutIsPaid,
  endsForNonPayment,
  isKnownSubscriptionStatus,
  readCheckout,
  rowStatusFor,
  settleSubscriptionUpdate,
  type StripeSide,
  type SubscriptionSnapshot,
} from '../api/_lib/subscription-status';

const NOW = new Date('2026-11-16T12:00:00Z');
const FUTURE = '2026-12-16T12:00:00Z';

/** Every subscription status in the Stripe SDK's `Subscription.Status` type. */
const STRIPE_STATUSES = [
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'paused',
  'trialing',
  'unpaid',
];
/** Things Stripe never sends today, including names that live on Object.prototype. */
const UNKNOWN = ['some_future_status', '', 'ACTIVE', 'constructor', 'toString', '__proto__'];

describe('rowStatusFor', () => {
  test('maps every Stripe status', () => {
    expect(STRIPE_STATUSES.map((s) => [s, rowStatusFor(s)])).toEqual([
      ['active', 'active'],
      ['canceled', 'canceled'],
      ['incomplete', 'incomplete'],
      ['incomplete_expired', 'canceled'],
      ['past_due', 'past_due'],
      ['paused', 'canceled'],
      ['trialing', 'trialing'],
      ['unpaid', 'past_due'],
    ]);
  });

  test('only active and trialing ever unlock Pro; an unknown status never does', () => {
    for (const status of [...STRIPE_STATUSES, ...UNKNOWN, null, undefined]) {
      const row = {
        plan_type: 'monthly',
        status: rowStatusFor(status),
        current_period_end: FUTURE,
      };
      expect([status, hasActivePro(row, NOW)]).toEqual([
        status,
        status === 'active' || status === 'trialing',
      ]);
    }
  });

  test('an unknown status is stored as incomplete and reported as unknown', () => {
    for (const status of [...UNKNOWN, null, undefined]) {
      expect(rowStatusFor(status)).toBe('incomplete');
      expect(isKnownSubscriptionStatus(status)).toBe(false);
    }
    for (const status of STRIPE_STATUSES) {
      expect(isKnownSubscriptionStatus(status)).toBe(true);
    }
  });

  test('never returns a value the database check constraint would reject', () => {
    const root = join(import.meta.dir, '..');
    for (const file of ['supabase-schema.sql', 'migrations/2026-04-23_user_subscriptions.sql']) {
      const sql = readFileSync(join(root, file), 'utf8');
      const match = sql.match(/status text not null default 'active' check \(status in \(([^)]*)\)\)/);
      expect(match).not.toBeNull();
      const allowed = match![1].split(',').map((v) => v.trim().replace(/'/g, ''));
      expect(allowed.length).toBeGreaterThan(0);
      for (const status of [...STRIPE_STATUSES, ...UNKNOWN, null, undefined]) {
        expect(allowed).toContain(rowStatusFor(status));
      }
    }
  });
});

describe('readCheckout', () => {
  test('lifetime is written only when the money has landed', () => {
    expect(checkoutIsPaid('paid')).toBe(true);
    expect(checkoutIsPaid('no_payment_required')).toBe(true);
    for (const paymentStatus of ['paid', 'no_payment_required']) {
      expect(readCheckout({ isLifetime: true, paymentStatus })).toEqual({
        write: true,
        status: 'active',
      });
    }
    for (const paymentStatus of ['unpaid', 'processing', '', null, undefined]) {
      expect(checkoutIsPaid(paymentStatus)).toBe(false);
      expect(readCheckout({ isLifetime: true, paymentStatus })).toEqual({
        write: false,
        reason: 'unpaid',
      });
    }
  });

  test('lifetime ignores any subscription status', () => {
    expect(
      readCheckout({ isLifetime: true, paymentStatus: 'unpaid', subscriptionStatus: 'active' }),
    ).toEqual({ write: false, reason: 'unpaid' });
  });

  test('a subscription plan with no subscription writes nothing', () => {
    for (const subscriptionStatus of [null, undefined]) {
      expect(readCheckout({ isLifetime: false, paymentStatus: 'paid', subscriptionStatus })).toEqual({
        write: false,
        reason: 'no-subscription',
      });
    }
  });

  test('a subscription plan stores the status Stripe reports', () => {
    const read = (subscriptionStatus: string) =>
      readCheckout({ isLifetime: false, paymentStatus: 'paid', subscriptionStatus });
    expect(read('active')).toEqual({ write: true, status: 'active' });
    expect(read('trialing')).toEqual({ write: true, status: 'trialing' });
    expect(read('incomplete')).toEqual({ write: true, status: 'incomplete' });
    expect(read('past_due')).toEqual({ write: true, status: 'past_due' });
    expect(read('unpaid')).toEqual({ write: true, status: 'past_due' });
    expect(read('some_future_status')).toEqual({ write: true, status: 'incomplete' });
  });

  test('an old event for a subscription that has ended writes nothing', () => {
    for (const subscriptionStatus of ['canceled', 'incomplete_expired', 'paused']) {
      expect(readCheckout({ isLifetime: false, paymentStatus: 'paid', subscriptionStatus })).toEqual({
        write: false,
        reason: 'subscription-ended',
      });
    }
  });

  test('a paid session never unlocks Pro for a subscription Stripe does not call active', () => {
    for (const subscriptionStatus of [...STRIPE_STATUSES, ...UNKNOWN]) {
      const reading = readCheckout({ isLifetime: false, paymentStatus: 'paid', subscriptionStatus });
      const unlocks =
        reading.write &&
        hasActivePro({ plan_type: 'monthly', status: reading.status, current_period_end: FUTURE }, NOW);
      expect([subscriptionStatus, unlocks]).toEqual([
        subscriptionStatus,
        subscriptionStatus === 'active' || subscriptionStatus === 'trialing',
      ]);
    }
  });
});

/** A stand-in for Stripe that records every call in order. */
function fakeStripe(
  freshStatus: string,
  failOn?: 'retrieve' | 'cancel' | 'voidOpenInvoices',
): { side: StripeSide<SubscriptionSnapshot>; calls: string[]; fresh: SubscriptionSnapshot } {
  const calls: string[] = [];
  const fresh = { id: 'sub_1', status: freshStatus };
  const step = (name: 'retrieve' | 'cancel' | 'voidOpenInvoices') => async (id: string) => {
    calls.push(`${name}:${id}`);
    if (failOn === name) throw new Error(`stripe ${name} failed`);
    return fresh;
  };
  return {
    calls,
    fresh,
    side: {
      retrieve: step('retrieve'),
      cancel: step('cancel'),
      voidOpenInvoices: step('voidOpenInvoices'),
    },
  };
}

const event = (status: string): SubscriptionSnapshot => ({ id: 'sub_1', status });

describe('settleSubscriptionUpdate', () => {
  test('a renewal still unpaid at Stripe is canceled once, then its open invoices are voided', async () => {
    for (const eventStatus of ['past_due', 'unpaid']) {
      for (const freshStatus of ['past_due', 'unpaid']) {
        const stripe = fakeStripe(freshStatus);
        const result = await settleSubscriptionUpdate(event(eventStatus), stripe.side);
        expect(stripe.calls).toEqual(['retrieve:sub_1', 'cancel:sub_1', 'voidOpenInvoices:sub_1']);
        expect(result).toEqual({ subscription: stripe.fresh, endedForNonPayment: true });
      }
    }
  });

  test('an old past_due event for a subscription that recovered cancels nothing', async () => {
    for (const freshStatus of ['active', 'trialing']) {
      const stripe = fakeStripe(freshStatus);
      const result = await settleSubscriptionUpdate(event('past_due'), stripe.side);
      expect(stripe.calls).toEqual(['retrieve:sub_1']);
      // The caller writes from Stripe's fresh copy, not the stale event.
      expect(result.endedForNonPayment).toBe(false);
      expect(result.subscription).toBe(stripe.fresh);
    }
  });

  test('a second delivery after the cancel does not cancel again', async () => {
    const stripe = fakeStripe('canceled');
    const result = await settleSubscriptionUpdate(event('past_due'), stripe.side);
    expect(stripe.calls).toEqual(['retrieve:sub_1', 'voidOpenInvoices:sub_1']);
    expect(result.endedForNonPayment).toBe(true);
  });

  test('an event that is not about a missed payment makes no Stripe call at all', async () => {
    for (const status of STRIPE_STATUSES.filter((s) => !endsForNonPayment(s)).concat(UNKNOWN)) {
      const stripe = fakeStripe('past_due');
      const fromEvent = event(status);
      const result = await settleSubscriptionUpdate(fromEvent, stripe.side);
      expect(stripe.calls).toEqual([]);
      expect(result).toEqual({ subscription: fromEvent, endedForNonPayment: false });
    }
  });

  test('cancel runs only when both the event and Stripe say the renewal is unpaid', async () => {
    let pairs = 0;
    for (const eventStatus of [...STRIPE_STATUSES, ...UNKNOWN]) {
      for (const freshStatus of [...STRIPE_STATUSES, ...UNKNOWN]) {
        const stripe = fakeStripe(freshStatus);
        await settleSubscriptionUpdate(event(eventStatus), stripe.side);
        const canceled = stripe.calls.includes('cancel:sub_1');
        expect([eventStatus, freshStatus, canceled]).toEqual([
          eventStatus,
          freshStatus,
          endsForNonPayment(eventStatus) && endsForNonPayment(freshStatus),
        ]);
        pairs++;
      }
    }
    expect(pairs).toBe(196);
  });

  test('a Stripe failure is passed up so the webhook fails and Stripe sends the event again', async () => {
    const retrieveFails = fakeStripe('past_due', 'retrieve');
    await expect(settleSubscriptionUpdate(event('past_due'), retrieveFails.side)).rejects.toThrow(
      'stripe retrieve failed',
    );
    expect(retrieveFails.calls).toEqual(['retrieve:sub_1']);

    const cancelFails = fakeStripe('past_due', 'cancel');
    await expect(settleSubscriptionUpdate(event('past_due'), cancelFails.side)).rejects.toThrow(
      'stripe cancel failed',
    );
    // Nothing is voided for a subscription that is still alive.
    expect(cancelFails.calls).toEqual(['retrieve:sub_1', 'cancel:sub_1']);

    const voidFails = fakeStripe('past_due', 'voidOpenInvoices');
    await expect(settleSubscriptionUpdate(event('past_due'), voidFails.side)).rejects.toThrow(
      'stripe voidOpenInvoices failed',
    );
  });
});
