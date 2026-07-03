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

## Notes on deviations from the design bundle

- The prototype wrapped the app in a fake iOS device frame (`ios-frame.jsx`) for previewing on a design canvas. That's dropped here — on a real phone the OS provides the status bar/home indicator, so the app fills the viewport directly and uses `env(safe-area-inset-*)` for notch/home-indicator spacing instead.
- Added a PWA manifest + service worker (installable, offline-capable) — proposed in the design chat as a near-term next step, not present in the original prototype.
