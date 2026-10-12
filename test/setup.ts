import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetNavigation } from './navigation';
import { resetSupabase } from './supabase';

// Test-only cleanup lives here, never on production modules.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetNavigation();
  resetSupabase();
});
