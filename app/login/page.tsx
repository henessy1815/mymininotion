'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { CircleAlert } from 'lucide-react';
import { actions, useStore } from '@/lib/store';

const ERRORS: Record<string, string> = {
  cancelled: '로그인이 취소되었어요. 다시 시도해 주세요.',
  failed: '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
};

/** 1a 로그인 · 1b 로그인 실패/취소 (`/login?error=cancelled`) */
export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const { ready, user } = useStore();
  const router = useRouter();
  const error = ERRORS[useSearchParams().get('error') ?? ''];

  useEffect(() => {
    if (ready && user) router.replace('/');
  }, [ready, user, router]);

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">N</div>
        <div style={{ font: 'var(--type-title-lg)', marginTop: 20 }}>미니 노션</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-secondary)', marginTop: 6 }}>
          나에게 맞춘 개인 업무 기록 공간
        </div>

        {error && (
          <div className="alert" role="alert" style={{ marginTop: 28 }}>
            <span className="alert-icon">
              <CircleAlert size={16} />
            </span>
            <span>{error}</span>
          </div>
        )}

        <div style={{ width: '100%', marginTop: error ? 12 : 36 }}>
          <button type="button" className="google-btn" disabled={!ready} onClick={() => actions.signInWithGoogle()}>
            <span className="google-mark">G</span>Google로 로그인
          </button>
        </div>
        <div
          style={{
            font: 'var(--type-meta)',
            color: 'var(--text-tertiary)',
            marginTop: 20,
            textAlign: 'center',
            textWrap: 'pretty',
          }}
        >
          처음 로그인하면 구글 계정의 이름과 프로필 사진으로 시작해요.
        </div>
      </div>
    </div>
  );
}
