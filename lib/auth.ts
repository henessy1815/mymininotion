'use client';

import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/**
 * Signed-in user, backed by Supabase Auth (Google) and the `profile` table.
 * The session is kept in localStorage (see `lib/supabase/client.ts`).
 * The profile row is created 1:1 by the `on_auth_user_created` trigger on
 * first sign-in, with `name` set from the auth user's Display Name (PRD #1).
 * The self-introduction is `profile.introduction`.
 */

export type User = {
  email: string;
  nickname: string;
  /** Google profile picture from the auth session; null → initials. */
  avatarUrl: string | null;
  /** `profile.introduction`; '' when not set. */
  introduction: string;
};

type AuthSnapshot = { ready: boolean; user: User | null };

const SERVER_SNAPSHOT: AuthSnapshot = { ready: false, user: null };

let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
let supabase: ReturnType<typeof createClient> | null = null;
let userId: string | null = null;
const listeners = new Set<() => void>();

function client() {
  return (supabase ??= createClient());
}

function emit(next: AuthSnapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

async function loadUser(session: Session | null) {
  if (!session) {
    userId = null;
    emit({ ready: true, user: null });
    return;
  }
  // Token refreshes re-fire the listener; the profile has not changed.
  if (session.user.id === userId && snapshot.user) return;
  userId = session.user.id;
  const { data } = await client()
    .from('profile')
    .select('name, introduction')
    .eq('user_id', session.user.id)
    .maybeSingle();
  const meta = session.user.user_metadata;
  emit({
    ready: true,
    user: {
      email: session.user.email ?? '',
      nickname: data?.name ?? meta.full_name ?? meta.name ?? '',
      avatarUrl: meta.avatar_url ?? meta.picture ?? null,
      introduction: data?.introduction ?? '',
    },
  });
}

let started = false;
function start() {
  if (started) return;
  started = true;
  // Fires INITIAL_SESSION right away, then on every sign-in/out (also from other tabs).
  client().auth.onAuthStateChange((_event, session) => {
    // Supabase calls listeners while holding its auth lock; querying inside would deadlock.
    setTimeout(() => void loadUser(session), 0);
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

export const authActions = {
  /** Leaves the app for Google; returns only when the redirect could not start. */
  async signInWithGoogle() {
    const { error } = await client().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  /** Finishes the PKCE flow on /auth/callback; the verifier is in localStorage. */
  async exchangeCode(code: string) {
    const { error } = await client().auth.exchangeCodeForSession(code);
    if (error) throw error;
  },

  async signOut() {
    await client().auth.signOut();
  },

  /** Throws when the update fails — callers show the error state. */
  async updateNickname(nickname: string) {
    if (!snapshot.user || !userId) return;
    // RLS turns a blocked update into "0 rows, no error"; .single() makes that an error too.
    const { data, error } = await client()
      .from('profile')
      .update({ name: nickname })
      .eq('user_id', userId)
      .select('name')
      .single();
    if (error) throw error;
    emit({ ready: true, user: { ...snapshot.user, nickname: data.name } });
  },

  /** Throws when the update fails — callers show the error state. '' clears it. */
  async updateIntroduction(introduction: string) {
    if (!snapshot.user || !userId) return;
    const { data, error } = await client()
      .from('profile')
      .update({ introduction })
      .eq('user_id', userId)
      .select('introduction')
      .single();
    if (error) throw error;
    emit({ ready: true, user: { ...snapshot.user, introduction: data.introduction ?? '' } });
  },
};
