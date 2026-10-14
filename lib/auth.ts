'use client';

import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getClient } from '@/lib/supabase/client';
import { newProfileImagePath, PROFILE_IMAGE_BUCKET, profileImageUrl } from '@/lib/profile-image';

/**
 * Signed-in user, backed by Supabase Auth (Google) and the `profile` table.
 * The session is kept in localStorage (see `lib/supabase/client.ts`).
 * The profile row is created 1:1 by the `on_auth_user_created` trigger on
 * first sign-in, with `name` set from the auth user's Display Name (PRD #1).
 * The self-introduction is `profile.introduction`. An uploaded profile image
 * is `profile.image_path` (see `lib/profile-image.ts`); without one the Google
 * picture is shown.
 */

export type User = {
  email: string;
  nickname: string;
  /** Uploaded image, else the Google picture from the auth session; null → initials. */
  avatarUrl: string | null;
  /** `profile.image_path`; null when nothing was uploaded. */
  imagePath: string | null;
  /** `profile.introduction`; '' when not set. */
  introduction: string;
};

type AuthSnapshot = { ready: boolean; user: User | null };

const SERVER_SNAPSHOT: AuthSnapshot = { ready: false, user: null };

let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
let userId: string | null = null;
let googleAvatarUrl: string | null = null;
const listeners = new Set<() => void>();

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
  const { data } = await getClient()
    .from('profile')
    .select('name, introduction, image_path')
    .eq('user_id', session.user.id)
    .maybeSingle();
  const meta = session.user.user_metadata;
  googleAvatarUrl = meta.avatar_url ?? meta.picture ?? null;
  const imagePath = data?.image_path ?? null;
  emit({
    ready: true,
    user: {
      email: session.user.email ?? '',
      nickname: data?.name ?? meta.full_name ?? meta.name ?? '',
      avatarUrl: imagePath ? profileImageUrl(imagePath) : googleAvatarUrl,
      imagePath,
      introduction: data?.introduction ?? '',
    },
  });
}

let started = false;
function start() {
  if (started) return;
  started = true;
  // Fires INITIAL_SESSION right away, then on every sign-in/out (also from other tabs).
  getClient().auth.onAuthStateChange((_event, session) => {
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

type ProfileRow = { name: string | null; introduction: string | null; image_path: string | null };

/**
 * Updates one column of the signed-in user's profile, then merges the saved
 * value into the user. Throws when the update fails — callers show the error state.
 */
async function updateProfile(
  patch: Partial<ProfileRow>,
  column: keyof ProfileRow,
  toUser: (row: Partial<ProfileRow>) => Partial<User>,
) {
  if (!snapshot.user || !userId) return;
  // RLS turns a blocked update into "0 rows, no error"; .single() makes that an error too.
  const { data, error } = await getClient()
    .from('profile')
    .update(patch)
    .eq('user_id', userId)
    .select(column)
    .single<Partial<ProfileRow>>();
  if (error) throw error;
  if (snapshot.user) emit({ ready: true, user: { ...snapshot.user, ...toUser(data) } });
}

export const authActions = {
  /** Leaves the app for Google; returns only when the redirect could not start. */
  async signInWithGoogle() {
    const { error } = await getClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  /** Finishes the PKCE flow on /auth/callback; the verifier is in localStorage. */
  async exchangeCode(code: string) {
    const { error } = await getClient().auth.exchangeCodeForSession(code);
    if (error) throw error;
  },

  async signOut() {
    await getClient().auth.signOut();
  },

  updateNickname(nickname: string) {
    return updateProfile({ name: nickname }, 'name', (row) => ({ nickname: row.name ?? '' }));
  },

  /** '' clears it. */
  updateIntroduction(introduction: string) {
    return updateProfile({ introduction }, 'introduction', (row) => ({ introduction: row.introduction ?? '' }));
  },

  /**
   * Uploads `file` under a new uuidv4 name, points `profile.image_path` at it,
   * then removes the previous upload. Callers validate the file first
   * (`checkProfileImage`); the bucket rejects anything else anyway.
   */
  async updateProfileImage(file: File) {
    if (!snapshot.user || !userId) return;
    const previous = snapshot.user.imagePath;
    const path = newProfileImagePath();
    const storage = getClient().storage.from(PROFILE_IMAGE_BUCKET);
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    try {
      await updateProfile({ image_path: path }, 'image_path', (row) => {
        const imagePath = row.image_path ?? null;
        return { imagePath, avatarUrl: imagePath ? profileImageUrl(imagePath) : googleAvatarUrl };
      });
    } catch (e) {
      // The profile still points at the previous image; drop the orphan.
      await storage.remove([path]);
      throw e;
    }
    // Best effort: a leftover old file is harmless, the profile no longer uses it.
    if (previous) await storage.remove([previous]);
  },
};
