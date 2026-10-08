'use client';

import { useSyncExternalStore } from 'react';

/**
 * Client-side page store. Pages still live in localStorage; the signed-in
 * user comes from Supabase (`lib/auth.ts`). To move pages to Supabase
 * (PRD §6), swap the functions in `actions` for API calls and keep the same shapes.
 */

export type Page = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

type Snapshot = { ready: boolean; pages: Page[] };

const STORAGE_KEY = 'mini-notion:v1';
const SERVER_SNAPSHOT: Snapshot = { ready: false, pages: [] };

let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function read(): Snapshot {
  if (snapshot) return snapshot;
  let pages: Page[] = [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) ({ pages = [] } = JSON.parse(raw));
  } catch {
    // corrupted storage → start fresh
  }
  snapshot = { ready: true, pages: sortPages(pages) };
  return snapshot;
}

/** Persists first so a failed write leaves the in-memory state untouched. */
function write(pages: Page[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages }));
  snapshot = { ready: true, pages: sortPages(pages) };
  listeners.forEach((l) => l());
}

function sortPages(pages: Page[]) {
  return [...pages].sort((a, b) => b.updatedAt - a.updatedAt);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    snapshot = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useStore(): Snapshot {
  return useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);
}

export function usePage(id: string) {
  const { ready, pages } = useStore();
  return { ready, page: pages.find((p) => p.id === id) ?? null };
}

export const actions = {
  createPage(): Page {
    const cur = read();
    const now = Date.now();
    const page: Page = { id: crypto.randomUUID(), title: '', content: '', createdAt: now, updatedAt: now };
    write([page, ...cur.pages]);
    return page;
  },

  /** Throws when storage is unavailable/full — callers show the "저장 실패" state. */
  updatePage(id: string, patch: Pick<Page, 'title' | 'content'>) {
    const cur = read();
    if (!cur.pages.some((p) => p.id === id)) return;
    write(cur.pages.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)));
  },

  deletePage(id: string) {
    const cur = read();
    write(cur.pages.filter((p) => p.id !== id));
  },
};
