'use client';

import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getClient } from '@/lib/supabase/client';

/**
 * Client-side page store, backed by the Supabase `page` table
 * (id, created_at, title, content, user_id). Only the signed-in user's pages
 * are loaded; RLS (`supabase/migrations/…_page_rls.sql`) enforces the same
 * rule on the server, the `user_id` filters here just make it explicit.
 */

export type Page = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
};

/** `failed`: the list could not be loaded — callers offer `actions.reload()`. */
type Snapshot = { ready: boolean; failed: boolean; pages: Page[] };

type Row = { id: string; title: string | null; content: string | null; created_at: string };

const COLUMNS = 'id, title, content, created_at';
const SERVER_SNAPSHOT: Snapshot = { ready: false, failed: false, pages: [] };

let snapshot: Snapshot = SERVER_SNAPSHOT;
/** `undefined` until the first auth event; `null` when signed out. */
let ownerId: string | null | undefined;
let loadSeq = 0;
const listeners = new Set<() => void>();

function toPage(row: Row): Page {
  return { id: row.id, title: row.title ?? '', content: row.content ?? '', createdAt: Date.parse(row.created_at) };
}

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function setPages(pages: Page[]) {
  emit({ ready: true, failed: false, pages });
}

async function load(userId: string) {
  const seq = ++loadSeq;
  const { data, error } = await getClient()
    .from('page')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  // A newer load (or sign-out) started while this one was in flight.
  if (seq !== loadSeq) return;
  if (error) emit({ ready: true, failed: true, pages: [] });
  else setPages(data.map(toPage));
}

function onSession(session: Session | null) {
  const id = session?.user.id ?? null;
  // Token refreshes re-fire the listener for the same user.
  if (id === ownerId) return;
  ownerId = id;
  if (!id) {
    loadSeq++;
    setPages([]);
    return;
  }
  emit(SERVER_SNAPSHOT);
  void load(id);
}

let started = false;
function start() {
  if (started) return;
  started = true;
  getClient().auth.onAuthStateChange((_event, session) => {
    // Supabase calls listeners while holding its auth lock; querying inside would deadlock.
    setTimeout(() => onSession(session), 0);
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

export function usePage(id: string) {
  const { ready, pages } = useStore();
  return { ready, page: pages.find((p) => p.id === id) ?? null };
}

function requireOwner() {
  if (!ownerId) throw new Error('Not signed in');
  return ownerId;
}

/** Every action throws when the request fails — callers show their error state. */
export const actions = {
  async createPage(): Promise<Page> {
    // `user_id` is sent explicitly: the column's default is not the signed-in user.
    const { data, error } = await getClient()
      .from('page')
      .insert({ user_id: requireOwner(), title: '', content: '' })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    const page = toPage(data);
    setPages([page, ...snapshot.pages]);
    return page;
  },

  async updatePage(id: string, patch: Pick<Page, 'title' | 'content'>) {
    // RLS turns a blocked update into "0 rows, no error"; .single() makes that an error too.
    const { error } = await getClient()
      .from('page')
      .update(patch)
      .eq('id', id)
      .eq('user_id', requireOwner())
      .select('id')
      .single();
    if (error) throw error;
    setPages(snapshot.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },

  async deletePage(id: string) {
    const { error } = await getClient().from('page').delete().eq('id', id).eq('user_id', requireOwner());
    if (error) throw error;
    setPages(snapshot.pages.filter((p) => p.id !== id));
  },

  /** Retries the initial list load after `failed`. */
  async reload() {
    if (!ownerId) return;
    emit(SERVER_SNAPSHOT);
    await load(ownerId);
  },
};
