import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cross-device sync is optional: without these env vars the app just runs on localStorage only.
// flowType 'implicit' puts the session tokens directly in the redirect URL hash, so a magic
// link works even when opened in a different browser/device than the one that requested it.
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
      })
    : null;
