-- =============================================
-- DEBT APP - SUPABASE SCHEMA
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- PROFILES (extends auth.users with app settings)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_name text default '',
  currency text default 'USD',
  date_format text default 'MM/DD/YYYY',
  theme jsonb default '{"preset": "default", "darkMode": false}'::jsonb,
  category_colors jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DEBTS
create table debts (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  balance numeric not null,
  original_balance numeric not null,
  apr numeric not null,
  minimum_payment numeric not null,
  due_day integer not null,
  credit_limit numeric,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- PAYMENTS
create table payments (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  debt_id uuid not null,
  amount numeric not null,
  principal numeric not null,
  interest numeric not null,
  date text not null,
  type text not null,
  is_completed boolean default false,
  completed_at text,
  note text,
  created_at timestamptz default now()
);

-- STRATEGY SETTINGS (one row per user)
create table strategy_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  strategy text default 'avalanche',
  recurring_funding jsonb default '{"amount": 0, "dayOfMonth": 1, "extraAmount": 0}'::jsonb,
  one_time_fundings jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- BUDGET SETTINGS (one row per user)
create table budget_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  income_sources jsonb default '[]'::jsonb,
  monthly_expenses numeric default 0,
  debt_allocation_amount numeric default 0,
  debt_allocation_percent numeric,
  expense_entries jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- CUSTOM CATEGORIES
create table custom_categories (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  icon text,
  created_at timestamptz not null
);

-- ASSETS
create table assets (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  balance numeric not null,
  balance_history jsonb default '[]'::jsonb,
  institution text,
  interest_rate numeric,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- SUBSCRIPTIONS
create table subscriptions (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  amount numeric not null,
  frequency jsonb not null,
  next_billing_date text not null,
  category text not null,
  is_active boolean default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- RECEIVED PAYCHECKS
create table received_paychecks (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  income_source_id text not null,
  pay_date text not null,
  pay_period_start text not null,
  pay_period_end text not null,
  expected_amount numeric not null,
  actual_amount numeric not null,
  note text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Ensures users can only access their own data
-- =============================================

alter table profiles enable row level security;
alter table debts enable row level security;
alter table payments enable row level security;
alter table strategy_settings enable row level security;
alter table budget_settings enable row level security;
alter table custom_categories enable row level security;
alter table assets enable row level security;
alter table subscriptions enable row level security;
alter table received_paychecks enable row level security;

-- PROFILES
create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- DEBTS
create policy "debts_select" on debts for select using (auth.uid() = user_id);
create policy "debts_insert" on debts for insert with check (auth.uid() = user_id);
create policy "debts_update" on debts for update using (auth.uid() = user_id);
create policy "debts_delete" on debts for delete using (auth.uid() = user_id);

-- PAYMENTS
create policy "payments_select" on payments for select using (auth.uid() = user_id);
create policy "payments_insert" on payments for insert with check (auth.uid() = user_id);
create policy "payments_update" on payments for update using (auth.uid() = user_id);
create policy "payments_delete" on payments for delete using (auth.uid() = user_id);

-- STRATEGY SETTINGS
create policy "strategy_select" on strategy_settings for select using (auth.uid() = user_id);
create policy "strategy_insert" on strategy_settings for insert with check (auth.uid() = user_id);
create policy "strategy_update" on strategy_settings for update using (auth.uid() = user_id);

-- BUDGET SETTINGS
create policy "budget_select" on budget_settings for select using (auth.uid() = user_id);
create policy "budget_insert" on budget_settings for insert with check (auth.uid() = user_id);
create policy "budget_update" on budget_settings for update using (auth.uid() = user_id);

-- CUSTOM CATEGORIES
create policy "categories_select" on custom_categories for select using (auth.uid() = user_id);
create policy "categories_insert" on custom_categories for insert with check (auth.uid() = user_id);
create policy "categories_update" on custom_categories for update using (auth.uid() = user_id);
create policy "categories_delete" on custom_categories for delete using (auth.uid() = user_id);

-- ASSETS
create policy "assets_select" on assets for select using (auth.uid() = user_id);
create policy "assets_insert" on assets for insert with check (auth.uid() = user_id);
create policy "assets_update" on assets for update using (auth.uid() = user_id);
create policy "assets_delete" on assets for delete using (auth.uid() = user_id);

-- SUBSCRIPTIONS
create policy "subscriptions_select" on subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions_insert" on subscriptions for insert with check (auth.uid() = user_id);
create policy "subscriptions_update" on subscriptions for update using (auth.uid() = user_id);
create policy "subscriptions_delete" on subscriptions for delete using (auth.uid() = user_id);

-- RECEIVED PAYCHECKS
create policy "paychecks_select" on received_paychecks for select using (auth.uid() = user_id);
create policy "paychecks_insert" on received_paychecks for insert with check (auth.uid() = user_id);
create policy "paychecks_update" on received_paychecks for update using (auth.uid() = user_id);
create policy "paychecks_delete" on received_paychecks for delete using (auth.uid() = user_id);

-- =============================================
-- AUTO-CREATE PROFILE + SETTINGS ON SIGNUP
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.strategy_settings (user_id) values (new.id);
  insert into public.budget_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
