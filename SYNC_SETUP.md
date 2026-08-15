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

## 3. Enable email login (magic link)
- Authentication → Sign In / Providers → **Email**: enable it. (No password is
  used; login happens via a link emailed to you.)
- Authentication → URL Configuration:
  - **Site URL**: your app URL, e.g. `https://fitness-flame-pi.vercel.app`
  - **Redirect URLs**: add your app URL, and `http://localhost:5173` if you also
    run it locally.

That's it — no email-template or SMTP changes needed. Supabase's built-in mailer
sends the default "sign-in link" email, which is all the app requires. (The
built-in mailer is rate-limited to a few messages per hour and can land in spam;
fine for personal use. Only set up custom SMTP if you ever share the app widely.)

## 4. Add the env vars
Vercel → Project → Settings → Environment Variables (Production + Preview):

```
VITE_SUPABASE_URL=<your Project URL>
VITE_SUPABASE_ANON_KEY=<your anon public key>
```

For local dev, put the same two lines in `app/.env`. Then redeploy on Vercel
(env changes need a fresh build).

## 5. Test
Open the app → you'll get the login screen → enter your email → open the sign-in
link from the mail on that device. Do the same on your phone with the same
email, and the data appears on both. "Uitloggen" lives at the bottom of the
Doelen tab.

Notes: the anon key is meant to be public (it ships in the browser bundle);
row level security is what actually keeps each account's data private, which is
why step 2 matters. Sync is last-write-wins per device, so if you edit the same
day offline on two devices at once, the last one to reconnect wins.
