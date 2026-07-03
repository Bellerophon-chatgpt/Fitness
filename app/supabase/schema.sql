-- Run this once in the Supabase project's SQL editor.
--
-- This app has no login: it's a single-user tool, and every device that
-- has the anon key can read/write the one row it uses. That's an
-- intentional tradeoff for "no accounts" — don't reuse this table/policy
-- for anything with more than one user or with sensitive data.

create table if not exists training_store (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table training_store enable row level security;

create policy "anon can read the single row"
  on training_store for select
  to anon
  using (id = 'main');

create policy "anon can write the single row"
  on training_store for insert
  to anon
  with check (id = 'main');

create policy "anon can update the single row"
  on training_store for update
  to anon
  using (id = 'main')
  with check (id = 'main');
