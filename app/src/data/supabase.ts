import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cross-device sync is optional: without these env vars the app just runs on localStorage only.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
