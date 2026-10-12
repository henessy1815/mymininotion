import { vi } from 'vitest';

/**
 * `lib/store.ts` caches its snapshot at module scope. Import a fresh copy
 * per test so state from one test never leaks into the next. Seed
 * `db.rows` (`@/test/supabase`) before calling this to start from a known
 * snapshot (test/setup.ts already mocks `@/lib/supabase/client` with it).
 */
export async function loadStore() {
  vi.resetModules();
  return import('@/lib/store');
}
