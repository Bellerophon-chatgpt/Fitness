import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Auth is only active when Supabase is configured (env vars present).
export const authEnabled = !!supabase;

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (s: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

// Sends a magic sign-in link to the given email. Clicking it returns the user
// to the app already authenticated (no code to type).
export async function sendMagicLink(email: string): Promise<string | null> {
  if (!supabase) return 'Synchronisatie is niet geconfigureerd.';
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
  });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
