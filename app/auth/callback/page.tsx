'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { authActions } from '@/lib/auth';

/** Strict Mode runs effects twice; a code can be exchanged only once. */
let pending: Promise<string> | null = null;

function finish(params: URLSearchParams) {
  if (params.get('error') === 'access_denied') return Promise.resolve('/login?error=cancelled');
  const code = params.get('code');
  if (!code) return Promise.resolve('/login?error=failed');
  return authActions.exchangeCode(code).then(
    () => '/',
    () => '/login?error=failed',
  );
}

/**
 * Google OAuth lands here with `?code=…`, or `?error=access_denied` when the
 * user backs out of the consent screen (PRD #1: stay on /login with a message).
 * The session is stored in localStorage, so the exchange runs in the browser.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    pending ??= finish(new URLSearchParams(window.location.search));
    pending.then((to) => {
      pending = null;
      router.replace(to);
    });
  }, [router]);

  return (
    <div className="login-screen">
      <span className="auth-pending" role="status">
        <LoaderCircle size={15} className="spin" />
        로그인 중…
      </span>
    </div>
  );
}
