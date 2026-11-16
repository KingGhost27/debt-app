/**
 * Wiring test for api/stripe-webhook.ts: the real handler, with Stripe and
 * Supabase replaced by recorders. It checks what the handler sends to each
 * for a given event; the rules themselves are covered in
 * subscription-status.test.ts and purchase-guard.test.ts.
 */
import { beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

interface Write {
  op: 'upsert' | 'update';
  payload: Record<string, unknown>;
  filters: Array<[string, unknown]>;
}

const state = {
  /** The one row the fake database holds, if any. */
  row: null as Record<string, unknown> | null,
  writes: [] as Write[],
  /** What Stripe reports for a subscription right now. */
  subscription: null as Record<string, unknown> | null,
  openInvoices: [] as string[],
  stripeCalls: [] as string[],
  cancelFails: false,
};

function query() {
  const filters: Array<[string, unknown]> = [];
  const api = {
    select: () => api,
    eq: (column: string, value: unknown) => {
      filters.push([column, value]);
      return api;
    },
    maybeSingle: async () => ({ data: state.row, error: null }),
    upsert: async (payload: Record<string, unknown>) => {
      state.writes.push({ op: 'upsert', payload, filters });
      return { error: null };
    },
    update: (payload: Record<string, unknown>) => {
      state.writes.push({ op: 'update', payload, filters });
      return api;
    },
    // The update chain is awaited directly.
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [{ id: 'row_1' }], error: null }).then(resolve),
  };
  return api;
}

class FakeStripe {
  webhooks = {
    constructEvent: (raw: Buffer, signature: string) => {
      if (signature !== 'sig_ok') throw new Error('bad signature');
      return JSON.parse(raw.toString('utf8'));
    },
  };
  subscriptions = {
    retrieve: async (id: string) => {
      state.stripeCalls.push(`retrieve:${id}`);
      return state.subscription;
    },
    cancel: async (id: string, params: Record<string, unknown>) => {
      state.stripeCalls.push(`cancel:${id}:prorate=${params.prorate}:invoice_now=${params.invoice_now}`);
      if (state.cancelFails) throw new Error('stripe is down');
      return {};
    },
  };
  invoices = {
    list: (params: Record<string, unknown>) => {
      state.stripeCalls.push(`listInvoices:${params.subscription}:${params.status}`);
      return (async function* () {
        for (const id of state.openInvoices) yield { id };
      })();
    },
    voidInvoice: async (id: string) => {
      state.stripeCalls.push(`void:${id}`);
      return {};
    },
  };
}

mock.module('stripe', () => ({ default: FakeStripe }));
mock.module('@supabase/supabase-js', () => ({ createClient: () => ({ from: query }) }));
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake';

const { default: handler } = await import('../api/stripe-webhook');

async function deliver(event: unknown, signature: string | null = 'sig_ok', method = 'POST') {
  const body = Buffer.from(JSON.stringify(event));
  const req = {
    method,
    headers: signature ? { 'stripe-signature': signature } : {},
    async *[Symbol.asyncIterator]() {
      yield body;
    },
  };
  const res = {
    code: 0,
    body: undefined as unknown,
    status(code: number) {
      res.code = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  await handler(req as never, res as never);
  return res;
}

const PERIOD_END = 1797367258;
const PERIOD_END_ISO = new Date(PERIOD_END * 1000).toISOString();

/** Shaped like a real subscription: the period end lives on the item. */
const subscription = (status: string, over: Record<string, unknown> = {}) => ({
  id: 'sub_1',
  customer: 'cus_1',
  status,
  cancel_at_period_end: false,
  items: { data: [{ current_period_end: PERIOD_END }] },
  ...over,
});

const checkout = (over: Record<string, unknown> = {}, type = 'checkout.session.completed') => ({
  type,
  data: {
    object: {
      id: 'cs_1',
      mode: 'subscription',
      client_reference_id: 'user_1',
      metadata: { userId: 'user_1', plan: 'monthly' },
      customer: 'cus_1',
      subscription: 'sub_1',
      payment_status: 'paid',
      ...over,
    },
  },
});

const lifetimeCheckout = (over: Record<string, unknown> = {}, type?: string) =>
  checkout(
    { mode: 'payment', metadata: { userId: 'user_1', plan: 'lifetime' }, subscription: null, ...over },
    type,
  );

const updated = (status: string) => ({
  type: 'customer.subscription.updated',
  data: { object: subscription(status) },
});

beforeEach(() => {
  state.row = null;
  state.writes = [];
  state.subscription = null;
  state.openInvoices = [];
  state.stripeCalls = [];
  state.cancelFails = false;
  for (const level of ['log', 'warn', 'error'] as const) {
    spyOn(console, level).mockImplementation(() => {});
  }
});

describe('the door', () => {
  test('rejects anything that is not a signed POST', async () => {
    expect((await deliver({}, 'sig_ok', 'GET')).code).toBe(405);
    expect((await deliver({}, null)).code).toBe(400);
    expect((await deliver({}, 'forged')).code).toBe(400);
    expect(state.writes).toEqual([]);
    expect(state.stripeCalls).toEqual([]);
  });
});

describe('checkout.session.completed', () => {
  test('a monthly purchase stores the status and dates Stripe reports', async () => {
    state.subscription = subscription('active');
    const res = await deliver(checkout());
    expect(res.code).toBe(200);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].op).toBe('upsert');
    expect(state.writes[0].payload).toMatchObject({
      user_id: 'user_1',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
      plan_type: 'monthly',
      status: 'active',
      current_period_end: PERIOD_END_ISO,
      cancel_at_period_end: false,
    });
  });

  test('a subscription Stripe does not call active is not stored as active', async () => {
    state.subscription = subscription('incomplete', { cancel_at_period_end: true });
    await deliver(checkout());
    expect(state.writes[0].payload).toMatchObject({ status: 'incomplete', cancel_at_period_end: true });
  });

  test('an old event for an ended subscription leaves the current plan alone', async () => {
    state.row = { plan_type: 'monthly', status: 'active', stripe_subscription_id: 'sub_new' };
    state.subscription = subscription('canceled');
    const res = await deliver(checkout());
    expect(res.code).toBe(200);
    expect(state.writes).toEqual([]);
  });

  test('a paid lifetime purchase is stored active without asking about a subscription', async () => {
    const res = await deliver(lifetimeCheckout());
    expect(res.code).toBe(200);
    expect(state.stripeCalls).toEqual([]);
    expect(state.writes[0].payload).toMatchObject({
      plan_type: 'lifetime',
      status: 'active',
      stripe_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
    });
  });

  test('a lifetime purchase whose money has not landed writes nothing', async () => {
    const res = await deliver(lifetimeCheckout({ payment_status: 'unpaid' }));
    expect(res.code).toBe(200);
    expect(state.writes).toEqual([]);
  });

  test('an existing lifetime plan is still never replaced', async () => {
    state.row = { plan_type: 'lifetime', status: 'active', current_period_end: null, stripe_subscription_id: null };
    state.subscription = subscription('active');
    await deliver(checkout());
    expect(state.writes).toEqual([]);
  });
});

describe('delayed payments', () => {
  test('a lifetime payment that lands later is granted then', async () => {
    await deliver(lifetimeCheckout({}, 'checkout.session.async_payment_succeeded'));
    expect(state.writes[0].payload).toMatchObject({ plan_type: 'lifetime', status: 'active' });
  });

  test('the same event for a subscription changes nothing; its own events cover it', async () => {
    state.subscription = subscription('active');
    await deliver(checkout({}, 'checkout.session.async_payment_succeeded'));
    expect(state.writes).toEqual([]);
    expect(state.stripeCalls).toEqual([]);
  });

  test('a failed delayed payment grants nothing', async () => {
    const res = await deliver(lifetimeCheckout({ payment_status: 'unpaid' }, 'checkout.session.async_payment_failed'));
    expect(res.code).toBe(200);
    expect(state.writes).toEqual([]);
  });
});

describe('customer.subscription.updated', () => {
  test('a failed renewal cancels the subscription, voids its open invoices and ends the plan', async () => {
    state.row = { plan_type: 'monthly' };
    state.subscription = subscription('past_due');
    state.openInvoices = ['in_1', 'in_2'];
    const res = await deliver(updated('past_due'));
    expect(res.code).toBe(200);
    expect(state.stripeCalls).toEqual([
      'retrieve:sub_1',
      'cancel:sub_1:prorate=false:invoice_now=false',
      'listInvoices:sub_1:open',
      'void:in_1',
      'void:in_2',
    ]);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].op).toBe('update');
    expect(state.writes[0].payload).toMatchObject({ status: 'canceled', cancel_at_period_end: false });
    expect(state.writes[0].filters).toEqual([['stripe_subscription_id', 'sub_1']]);
  });

  test('a late past_due event for a subscription that has since been paid cancels nothing', async () => {
    state.row = { plan_type: 'monthly' };
    state.subscription = subscription('active');
    await deliver(updated('past_due'));
    expect(state.stripeCalls).toEqual(['retrieve:sub_1']);
    expect(state.writes[0].payload).toMatchObject({
      status: 'active',
      current_period_end: PERIOD_END_ISO,
      cancel_at_period_end: false,
    });
  });

  test('an ordinary update is stored as Stripe sent it, with no Stripe calls', async () => {
    state.row = { plan_type: 'monthly' };
    await deliver({
      type: 'customer.subscription.updated',
      data: { object: subscription('active', { cancel_at_period_end: true }) },
    });
    expect(state.stripeCalls).toEqual([]);
    expect(state.writes[0].payload).toMatchObject({ status: 'active', cancel_at_period_end: true });
    expect(state.writes[0].filters).toEqual([['stripe_subscription_id', 'sub_1']]);
  });

  test('a lifetime customer is skipped before anything is canceled', async () => {
    state.row = { plan_type: 'lifetime' };
    state.subscription = subscription('past_due');
    const res = await deliver(updated('past_due'));
    expect(res.code).toBe(200);
    expect(state.stripeCalls).toEqual([]);
    expect(state.writes).toEqual([]);
  });

  test('if Stripe fails mid-cancel the webhook answers 500 so Stripe sends the event again', async () => {
    state.row = { plan_type: 'monthly' };
    state.subscription = subscription('past_due');
    state.cancelFails = true;
    const res = await deliver(updated('past_due'));
    expect(res.code).toBe(500);
    expect(state.writes).toEqual([]);
  });
});

describe('customer.subscription.deleted', () => {
  test('still marks the plan canceled', async () => {
    state.row = { plan_type: 'monthly' };
    await deliver({ type: 'customer.subscription.deleted', data: { object: subscription('canceled') } });
    expect(state.writes[0].payload).toMatchObject({ status: 'canceled' });
    expect(state.writes[0].filters).toEqual([['stripe_subscription_id', 'sub_1']]);
  });
});
