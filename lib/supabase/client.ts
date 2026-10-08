import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** Browser-only client. The session lives in localStorage, so the server never sees it. */
export function createClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      storage: window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
      // /auth/callback exchanges the code itself so it can show cancel/fail states.
      detectSessionInUrl: false,
    },
  });
}
