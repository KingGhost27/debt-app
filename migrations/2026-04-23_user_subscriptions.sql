-- Migration: user_subscriptions table for Stripe Pro tier tracking
-- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run
-- Safe to re-run (uses IF NOT EXISTS where possible)

create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  plan_type text not null check (plan_type in ('monthly', 'annual', 'lifetime')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_subscriptions enable row level security;

-- Users can read their own subscription row (writes happen via service role in webhook)
drop policy if exists "subscriptions_select_own" on user_subscriptions;
create policy "subscriptions_select_own" on user_subscriptions
  for select using (auth.uid() = user_id);
