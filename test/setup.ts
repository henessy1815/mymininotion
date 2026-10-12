import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { resetNavigation } from './navigation';
import { resetSupabase } from './supabase';

// Every test talks to the in-memory double, never a real Supabase project.
vi.mock('@/lib/supabase/client', () => import('./supabase'));

// Test-only cleanup lives here, never on production modules.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetNavigation();
  resetSupabase();
});
