import { describe, expect, test } from 'bun:test';
import {
  decideCheckoutWrite,
  hasActivePro,
  type SubscriptionRowLike,
} from '../api/_lib/purchase-guard';
import { resolveEntitlement } from '../src/lib/entitlement';

const NOW = new Date('2026-11-15T12:00:00Z');
const FUTURE = '2026-12-15T12:00:00Z';
const PAST = '2026-10-15T12:00:00Z';

const row = (over: Partial<SubscriptionRowLike>): SubscriptionRowLike => ({
  plan_type: 'monthly',
  status: 'active',
  current_period_end: FUTURE,
  stripe_subscription_id: 'sub_old',
  ...over,
});

describe('hasActivePro', () => {
  test('matches resolveEntitlement on every status × plan × period × provider combination', () => {
    const statuses = ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid'];
    const plans = ['monthly', 'annual', 'lifetime'];
    const periods = [FUTURE, PAST, null];
    const providers = ['stripe', 'play', null];
    let checked = 0;
    for (const status of statuses) {
      for (const plan_type of plans) {
        for (const current_period_end of periods) {
          for (const provider of providers) {
            const r = { ...row({ status, plan_type, current_period_end }), provider };
            expect(hasActivePro(r, NOW)).toBe(resolveEntitlement(r, NOW).isPro);
            checked++;
          }
        }
      }
    }
    expect(checked).toBe(162);
    expect(hasActivePro(null, NOW)).toBe(resolveEntitlement(null, NOW).isPro);
  });

  test('blocks active lifetime and unexpired active subscriptions', () => {
    expect(hasActivePro(row({ plan_type: 'lifetime', current_period_end: null }), NOW)).toBe(true);
    expect(hasActivePro(row({ plan_type: 'monthly' }), NOW)).toBe(true);
    expect(hasActivePro(row({ plan_type: 'annual', status: 'trialing' }), NOW)).toBe(true);
  });

  test('lets free, canceled and expired accounts buy', () => {
    expect(hasActivePro(null, NOW)).toBe(false);
    expect(hasActivePro(undefined, NOW)).toBe(false);
    expect(hasActivePro(row({ status: 'canceled' }), NOW)).toBe(false);
    expect(hasActivePro(row({ current_period_end: PAST }), NOW)).toBe(false);
    expect(hasActivePro(row({ status: 'past_due' }), NOW)).toBe(false);
  });
});

describe('decideCheckoutWrite', () => {
  const lifetime = row({ plan_type: 'lifetime', current_period_end: null, stripe_subscription_id: null });

  test('never replaces an active lifetime plan, whatever was bought', () => {
    expect(decideCheckoutWrite(lifetime, 'sub_new', NOW)).toEqual({ action: 'keep-lifetime' });
    expect(decideCheckoutWrite(lifetime, null, NOW)).toEqual({ action: 'keep-lifetime' });
  });

  test('writes a first purchase', () => {
    expect(decideCheckoutWrite(null, 'sub_new', NOW)).toEqual({ action: 'write', orphanedSubscriptionId: null });
    expect(decideCheckoutWrite(null, null, NOW)).toEqual({ action: 'write', orphanedSubscriptionId: null });
  });

  test('writes over a canceled plan without flagging it', () => {
    expect(decideCheckoutWrite(row({ status: 'canceled' }), 'sub_new', NOW)).toEqual({
      action: 'write',
      orphanedSubscriptionId: null,
    });
    // A canceled lifetime row is not a paid plan to protect.
    expect(decideCheckoutWrite({ ...lifetime, status: 'canceled' }, 'sub_new', NOW)).toEqual({
      action: 'write',
      orphanedSubscriptionId: null,
    });
  });

  test('flags past_due and stale rows: no Pro, but Stripe may still collect', () => {
    // Card declined → past_due → user buys again; Stripe keeps retrying sub_old.
    expect(decideCheckoutWrite(row({ status: 'past_due' }), 'sub_new', NOW)).toEqual({
      action: 'write',
      orphanedSubscriptionId: 'sub_old',
    });
    // Renewal event lost (e.g. Supabase paused), so the period looks expired.
    expect(decideCheckoutWrite(row({ current_period_end: PAST }), 'sub_new', NOW)).toEqual({
      action: 'write',
      orphanedSubscriptionId: 'sub_old',
    });
  });

  test('flags a still-active subscription the new purchase would orphan', () => {
    expect(decideCheckoutWrite(row({}), 'sub_new', NOW)).toEqual({
      action: 'write',
      orphanedSubscriptionId: 'sub_old',
    });
    // Monthly upgraded to lifetime in a second tab: the monthly keeps billing.
    expect(decideCheckoutWrite(row({}), null, NOW)).toEqual({
      action: 'write',
      orphanedSubscriptionId: 'sub_old',
    });
  });

  test('does not flag a replay of the same subscription', () => {
    expect(decideCheckoutWrite(row({ stripe_subscription_id: 'sub_same' }), 'sub_same', NOW)).toEqual({
      action: 'write',
      orphanedSubscriptionId: null,
    });
  });
});
