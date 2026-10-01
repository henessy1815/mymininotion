'use client';

import { useSyncExternalStore } from 'react';

/**
 * Client-side data layer for the mockup.
 * Everything lives in localStorage so the app runs without a backend.
 * To move to Supabase (PRD §6), swap the functions in `actions` for API calls
 * and keep the same shapes.
 */

export type Page = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type User = {
  email: string;
  nickname: string;
  /** null → default Google profile image (rendered as initials). */
  avatarUrl: string | null;
};

type Snapshot = { ready: boolean; user: User | null; pages: Page[] };

const STORAGE_KEY = 'mini-notion:v1';
const SERVER_SNAPSHOT: Snapshot = { ready: false, user: null, pages: [] };

let snapshot: Snapshot | null = null;
const listeners = new Set<() => void>();

function read(): Snapshot {
  if (snapshot) return snapshot;
  let user: User | null = null;
  let pages: Page[] = [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) ({ user = null, pages = [] } = JSON.parse(raw));
  } catch {
    // corrupted storage → start fresh
  }
  snapshot = { ready: true, user, pages: sortPages(pages) };
  return snapshot;
}

/** Persists first so a failed write leaves the in-memory state untouched. */
function write(next: Omit<Snapshot, 'ready'>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  snapshot = { ready: true, user: next.user, pages: sortPages(next.pages) };
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

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function seedPages(now: number): Page[] {
  const body =
    '이번 주 핵심 업무\n- 4분기 계획 초안 공유 (완료)\n- 미니 노션 MVP: 구글 로그인, /page 명령어 구현\n- 고객 피드백 정리 후 우선순위 다시 보기\n\n다음 주 할 일\n- 마이 페이지 프로필 이미지 업로드\n- 자동 저장 실패 시 재시도 처리 점검';
  const rows: [string, string, number, number][] = [
    ['주간 업무 정리 — 9월 4주차', body, 0.1 * HOUR, 6 * DAY],
    ['회의록: 4분기 계획 킥오프', '', 3.5 * HOUR, 1 * DAY],
    ['', '', 1 * DAY, 1 * DAY],
    ['미니 노션 개발 메모 — Supabase RLS 설정', '', 2 * DAY, 3 * DAY],
    ['할 일', '', 3 * DAY, 3 * DAY],
    ['읽을 거리 모음', '', 5 * DAY, 9 * DAY],
    ['개인 프로젝트 아이디어', '', 7 * DAY, 12 * DAY],
    ['10월 휴가 계획', '', 10 * DAY, 10 * DAY],
  ];
  return rows.map(([title, content, updatedAgo, createdAgo]) => ({
    id: crypto.randomUUID(),
    title,
    content,
    updatedAt: now - updatedAgo,
    createdAt: now - createdAgo,
  }));
}

export const actions = {
  /** Mock Google sign-in. The first sign-in creates the profile (and sample pages). */
  signInWithGoogle() {
    const cur = read();
    const isFirst = !cur.user && cur.pages.length === 0;
    write({
      user: cur.user ?? { email: 'henessy@gmail.com', nickname: '헤네시', avatarUrl: null },
      pages: isFirst ? seedPages(Date.now()) : cur.pages,
    });
  },

  signOut() {
    const cur = read();
    // Keep pages so signing back in restores them (they belong to the same account).
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: null, pages: cur.pages }));
    snapshot = { ...cur, user: null };
    listeners.forEach((l) => l());
  },

  createPage(): Page {
    const cur = read();
    const now = Date.now();
    const page: Page = { id: crypto.randomUUID(), title: '', content: '', createdAt: now, updatedAt: now };
    write({ user: cur.user, pages: [page, ...cur.pages] });
    return page;
  },

  /** Throws when storage is unavailable/full — callers show the "저장 실패" state. */
  updatePage(id: string, patch: Pick<Page, 'title' | 'content'>) {
    const cur = read();
    if (!cur.pages.some((p) => p.id === id)) return;
    write({
      user: cur.user,
      pages: cur.pages.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
    });
  },

  deletePage(id: string) {
    const cur = read();
    write({ user: cur.user, pages: cur.pages.filter((p) => p.id !== id) });
  },

  updateProfile(patch: Partial<Pick<User, 'nickname' | 'avatarUrl'>>) {
    const cur = read();
    if (!cur.user) return;
    write({ user: { ...cur.user, ...patch }, pages: cur.pages });
  },
};
