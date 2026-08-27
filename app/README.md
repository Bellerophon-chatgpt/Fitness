# FORM&FUEL

Mobile workout logger — implementation of the `Trainingschema prototype.html` design (see `../project/` and `../chats/` for the original design bundle).

Built with Vite + React + TypeScript. Installable as a PWA (works offline, add to home screen).

## Develop

```
npm install
npm run dev
```

Open on your phone (same network) via the "Network" URL Vite prints, or resize your browser to a mobile width — the layout is a single-column mobile view with no desktop breakpoint, matching the original design.

## Cross-device sync (optional)

Data is always saved to `localStorage` first, so the app works fully offline. If you also want your schema and logged sets to follow you across devices/browsers, wire it up to a free [Supabase](https://supabase.com) project — no login required, just one shared row:

1. Create a Supabase project.
2. In the SQL editor, run `supabase/schema.sql` from this folder.
3. Copy `.env.example` to `.env.local` and fill in the project's URL and anon key (Project Settings → API).
4. Restart `npm run dev` (or rebuild).

Without those env vars set, the app just runs on `localStorage` as before — sync is entirely optional. When enabled, the newest of the local/remote copy wins on load (by last-write timestamp), changes are pushed to Supabase ~800ms after you stop making them, and a small "offline" icon appears in the top bar if a change couldn't be synced yet.

Note the schema's RLS policy is intentionally wide open to anyone holding the anon key (scoped to a single fixed row) — that's the tradeoff for skipping accounts on a single-user app. Don't reuse it for multi-user data.

## Build

```
npm run build
npm run preview
```

## Cross-device sync

Training and nutrition sync across devices via Supabase. You sign in with a
magic link emailed to you (no password); each account has its own private row
protected by row level security. Without the Supabase env vars the app runs
local-only and shows a "use on this device only" option. See
[`SYNC_SETUP.md`](./SYNC_SETUP.md) for the one-time dashboard setup (table, RLS,
email template, env vars). Sign-out is at the bottom of the Doelen tab.

## Voeding / macro-tracking

The **Voeding** tab logs food per day, split across Ontbijt, Lunch, Diner and Snacks, and tracks carbohydrate, protein and fat (plus calories) against editable daily goals. A day's totals are shown as a macro ring; tap it to set your goals.

Adding food supports three routes:

- **Barcode scanner** — uses the device camera (`@zxing/browser`, lazy-loaded so it stays out of the main bundle) to read EAN/UPC codes, then looks the product up in [Open Food Facts](https://world.openfoodfacts.org) and pre-fills the macros. No API key is required. If a barcode isn't in the database, it falls back to manual entry with the code pre-filled. A manual barcode field is also provided in case the camera is unavailable.
- **Search** — a search box matches a built-in list of common foods and, when online, queries Open Food Facts by name.
- **Eigen voeding** — enter a name and per-100 g/ml macros by hand.

Each logged item stores its macros *per 100 g/ml*, so editing the amount rescales the calories and macros automatically. Foods you've logged before appear under "Recent" in the food picker (deduped, most-recent first, remembering the last amount used) for quick re-adding. Nutrition data — including recents — is saved in the same store as the training schema and rides along on the optional Supabase sync.

Camera access requires a secure context (HTTPS or `localhost`) — the Vercel deployment and `localhost` dev server both qualify.

The **Doelen** tab summarises the week's nutrition: a 7-day bar chart that switches between calories and each macro (protein / carbs / fat) with a dashed goal line, plus average macros over the days you actually logged (shown against your daily goals). The two stat tiles are computed from your actual weekly schedule (training days and total sets). It also tracks **bodyweight** — log today's weight to build a trend line with an editable target — and lets you keep **editable strength goals** (tap one to edit, or add your own). An empty day in the Voeding tab offers a "Kopieer vorige dag" button that clones the previous day's log.

## Notes on deviations from the design bundle

- The prototype wrapped the app in a fake iOS device frame (`ios-frame.jsx`) for previewing on a design canvas. That's dropped here — on a real phone the OS provides the status bar/home indicator, so the app fills the viewport directly and uses `env(safe-area-inset-*)` for notch/home-indicator spacing instead.
- Added a PWA manifest + service worker (installable, offline-capable) — proposed in the design chat as a near-term next step, not present in the original prototype.
