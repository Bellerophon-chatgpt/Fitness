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

// Sends a 6-digit login code (and magic link) to the given email.
export async function sendLoginCode(email: string): Promise<string | null> {
  if (!supabase) return 'Synchronisatie is niet geconfigureerd.';
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  return error ? error.message : null;
}

export async function verifyLoginCode(email: string, token: string): Promise<string | null> {
  if (!supabase) return 'Synchronisatie is niet geconfigureerd.';
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}
