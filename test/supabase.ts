/**
 * In-memory double for `@/lib/supabase/client`, covering only the query
 * shapes `lib/store.ts` uses on the `page` table and `lib/auth.ts` uses on
 * the `profile` table. Like Supabase with RLS, every query only sees the
 * signed-in user's rows. test/setup.ts registers it for every test file.
 *
 * Usage in a test file:
 *   import { db } from '@/test/supabase';
 *   db.rows.push(pageRow({ id: 'p1' }));
 *   db.profile.introduction = '소개';
 *   db.fail.update = true; // next updates resolve with an error
 */

export type PageRow = { id: string; created_at: string; title: string | null; content: string | null; user_id: string };
type Op = 'select' | 'insert' | 'update' | 'delete';

/** The signed-in user's `profile` row (the double has only that one). */
export type ProfileRow = { name: string | null; introduction: string | null };

type DbState = { userId: string | null; rows: PageRow[]; profile: ProfileRow; fail: Record<Op, boolean> };

export const SIGNED_IN_USER = 'user-1';

function initialState(): DbState {
  return {
    userId: SIGNED_IN_USER,
    rows: [],
    profile: { name: '고양이', introduction: null },
    fail: { select: false, insert: false, update: false, delete: false },
  };
}

// Kept on globalThis so `loadStore()`'s vi.resetModules() cannot split the test's `db` from the store's.
const g = globalThis as typeof globalThis & { __supabaseDouble?: DbState };
export const db: DbState = (g.__supabaseDouble ??= initialState());

/** Called from test/setup.ts after every test. */
export function resetSupabase() {
  Object.assign(db, initialState());
}

export function pageRow(row: Partial<PageRow> & { id: string }): PageRow {
  return { created_at: '2026-10-12T00:00:00Z', title: '', content: '', user_id: SIGNED_IN_USER, ...row };
}

type Result = { data: unknown; error: Error | null };

class Query implements PromiseLike<Result> {
  private op: Op = 'select';
  private payload: Partial<PageRow> = {};
  private filters: [keyof PageRow, unknown][] = [];
  private expectOne = false;
  private descending = false;

  select() {
    return this;
  }
  insert(values: Partial<PageRow>) {
    this.op = 'insert';
    this.payload = values;
    return this;
  }
  update(values: Partial<PageRow>) {
    this.op = 'update';
    this.payload = values;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(column: keyof PageRow, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }
  order(_column: 'created_at', { ascending }: { ascending: boolean }) {
    this.descending = !ascending;
    return this;
  }
  /** Errors unless exactly one row matches, like Supabase. */
  single() {
    this.expectOne = true;
    return this;
  }

  then: PromiseLike<Result>['then'] = (onFulfilled, onRejected) => Promise.resolve(this.run()).then(onFulfilled, onRejected);

  private visible(row: PageRow) {
    return row.user_id === db.userId && this.filters.every(([c, v]) => row[c] === v);
  }

  private run(): Result {
    if (db.fail[this.op]) return { data: null, error: new Error(`${this.op} failed`) };
    let result: PageRow[];
    if (this.op === 'insert') {
      if (this.payload.user_id !== db.userId) return { data: null, error: new Error('RLS: insert denied') };
      const row = pageRow({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...this.payload } as PageRow);
      db.rows.push(row);
      result = [row];
    } else if (this.op === 'update') {
      result = db.rows.filter((r) => this.visible(r));
      result.forEach((r) => Object.assign(r, this.payload));
    } else if (this.op === 'delete') {
      result = db.rows.filter((r) => this.visible(r));
      db.rows = db.rows.filter((r) => !result.includes(r));
    } else {
      result = db.rows.filter((r) => this.visible(r));
      if (this.descending) result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    if (!this.expectOne) return { data: result, error: null };
    if (result.length !== 1) return { data: null, error: new Error(`expected 1 row, got ${result.length}`) };
    return { data: result[0], error: null };
  }
}

/** `profile`: select → maybeSingle, update → select → single. */
class ProfileQuery implements PromiseLike<Result> {
  private patch: Partial<ProfileRow> | null = null;

  select() {
    return this;
  }
  update(values: Partial<ProfileRow>) {
    this.patch = values;
    return this;
  }
  eq() {
    return this;
  }
  single() {
    return this;
  }
  maybeSingle() {
    return this;
  }

  then: PromiseLike<Result>['then'] = (onFulfilled, onRejected) => Promise.resolve(this.run()).then(onFulfilled, onRejected);

  private run(): Result {
    const op: Op = this.patch ? 'update' : 'select';
    if (db.fail[op]) return { data: null, error: new Error(`${op} failed`) };
    if (!db.userId) return { data: null, error: null };
    if (this.patch) Object.assign(db.profile, this.patch);
    return { data: { ...db.profile }, error: null };
  }
}

const client = {
  from: (table: string) => (table === 'profile' ? new ProfileQuery() : new Query()),
  auth: {
    onAuthStateChange(callback: (event: string, session: unknown) => void) {
      const session = db.userId ? { user: { id: db.userId, email: 'me@example.com', user_metadata: {} } } : null;
      // Synchronous here; `lib/store.ts` already defers its work with setTimeout(0).
      callback('INITIAL_SESSION', session);
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
};

export const getClient = () => client;
