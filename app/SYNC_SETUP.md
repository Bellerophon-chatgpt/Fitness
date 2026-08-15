# Cross-device sync setup (Supabase)

The app syncs training + nutrition across devices through a Supabase project.
Each account gets its own private row, protected by row level security, and you
sign in with a one-time code sent to your email (no password). Without the two
env vars below the app simply runs local-only, so nothing breaks if you skip it.

Do these steps once in the Supabase dashboard.

## 1. Create a project
supabase.com → New project. Note the **Project URL** and the **anon public key**
from Project Settings → API.

## 2. Create the table + security rules
SQL Editor → run this. (If a `training_store` table already exists from an
earlier version, this drops and recreates it — it only held seed data.)

```sql
drop table if exists public.training_store;

create table public.training_store (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.training_store enable row level security;

create policy "own row select" on public.training_store
  for select using (auth.uid() = id);
create policy "own row insert" on public.training_store
  for insert with check (auth.uid() = id);
create policy "own row update" on public.training_store
  for update using (auth.uid() = id) with check (auth.uid() = id);
```

## 3. Enable email login with a code
- Authentication → Providers → **Email**: enable it. (Password isn't used.)
- Authentication → URL Configuration → set **Site URL** to your app URL
  (e.g. `https://fitness-flame-pi.vercel.app`).
- Authentication → Email Templates: the code login needs the 6-digit token in
  the email. In **both** the "Magic Link" and "Confirm signup" templates, make
  sure the body includes the token, e.g.:

  ```html
  <p>Je inlogcode voor FORM&amp;FUEL is:</p>
  <p style="font-size:24px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
  ```

## 4. Add the env vars
Vercel → Project → Settings → Environment Variables (Production + Preview):

```
VITE_SUPABASE_URL=<your Project URL>
VITE_SUPABASE_ANON_KEY=<your anon public key>
```

For local dev, put the same two lines in `app/.env`. Then redeploy on Vercel
(env changes need a fresh build).

## 5. Test
Open the app → you'll get the login screen → enter your email → type the code
from the mail. Do the same on your phone with the same email, and the data
appears on both. "Uitloggen" lives at the bottom of the Doelen tab.

Notes: the anon key is meant to be public (it ships in the browser bundle);
row level security is what actually keeps each account's data private, which is
why step 2 matters. Sync is last-write-wins per device, so if you edit the same
day offline on two devices at once, the last one to reconnect wins.
