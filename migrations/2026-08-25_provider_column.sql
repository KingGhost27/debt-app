-- Migration: provider column for provider-agnostic entitlements (Play Billing ready)
-- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to re-run (IF NOT EXISTS / drop-then-add constraint pattern)
--
-- Deploy-order independent by design: the app code tolerates this column
-- existing or not, and DEFAULT 'stripe' stamps every existing and future
-- Stripe row without any webhook change.

alter table user_subscriptions
  add column if not exists provider text not null default 'stripe';

alter table user_subscriptions
  drop constraint if exists user_subscriptions_provider_check;

alter table user_subscriptions
  add constraint user_subscriptions_provider_check
  check (provider in ('stripe', 'play'));

-- Future Play rows have no Stripe customer; relax the NOT NULL —
-- but keep the invariant for Stripe rows via a paired CHECK, so a bug
-- in the Stripe path can't silently write a NULL customer.
alter table user_subscriptions
  alter column stripe_customer_id drop not null;

alter table user_subscriptions
  drop constraint if exists user_subscriptions_stripe_requires_customer;

alter table user_subscriptions
  add constraint user_subscriptions_stripe_requires_customer
  check (provider <> 'stripe' or stripe_customer_id is not null);
