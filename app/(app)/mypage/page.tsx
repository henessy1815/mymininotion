'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ds';
import { UserAvatar } from '@/components/shell';
import { authActions, useAuth, type User } from '@/lib/auth';

const NICKNAME_MAX = 20;
const INTRODUCTION_MAX = 200;

/** 1g 마이 페이지 */
export default function MyPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <div className="sheet-header">
        <span className="sheet-title">마이 페이지</span>
      </div>
      <div className="sheet-scroll">
        <div className="mypage">
          <div className="mypage-inner">
            <AvatarSection user={user} />
            <NicknameSection user={user} />
            <IntroductionSection user={user} />
            <AccountSection user={user} />
          </div>
        </div>
      </div>
    </>
  );
}

function AvatarSection({ user }: { user: User }) {
  return (
    <section className="mp-section">
      <div className="mp-head">
        <span className="mp-head-title">프로필 이미지</span>
        <span className="mp-head-desc">Google 계정의 프로필 사진이 표시돼요.</span>
      </div>
      <div className="mp-avatar-row">
        <UserAvatar user={user} size={80} />
      </div>
    </section>
  );
}

/** Edit-then-save state for one profile text field; the saved value is trimmed. */
function useProfileField(saved: string, save: (value: string) => Promise<void>) {
  const [value, setValue] = useState(saved);
  const [result, setResult] = useState<'saved' | 'failed' | null>(null);
  const [saving, setSaving] = useState(false);
  const trimmed = value.trim();
  const unchanged = trimmed === saved;

  return {
    value,
    trimmed,
    unchanged,
    saving,
    result,
    change(next: string) {
      setValue(next);
      setResult(null);
    },
    async submit() {
      if (unchanged || saving) return;
      setSaving(true);
      setResult(null);
      try {
        await save(trimmed);
        setValue(trimmed);
        setResult('saved');
      } catch {
        setResult('failed');
      } finally {
        setSaving(false);
      }
    },
  };
}

function NicknameSection({ user }: { user: User }) {
  const field = useProfileField(user.nickname, authActions.updateNickname);
  const invalid = field.trimmed.length === 0;

  return (
    <section className="mp-section">
      <div className="mp-head">
        <span className="mp-head-title">별명</span>
        <span className="mp-head-desc">화면 상단 프로필에 표시돼요.</span>
      </div>
      <form
        className="mp-field-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!invalid) void field.submit();
        }}
      >
        <label className="mp-field">
          <input value={field.value} maxLength={NICKNAME_MAX} aria-label="별명" onChange={(e) => field.change(e.target.value)} />
          <span className="meta">
            {field.value.length}/{NICKNAME_MAX}
          </span>
        </label>
        <Button type="submit" size="lg" disabled={invalid || field.unchanged || field.saving}>
          저장
        </Button>
      </form>
      {invalid && <span className="mp-field-hint is-error">별명을 입력해 주세요. 공백만으로는 저장할 수 없어요.</span>}
      {field.result === 'saved' && !invalid && <span className="mp-field-hint">별명을 저장했어요.</span>}
      {field.result === 'failed' && <span className="mp-field-hint is-error">별명을 저장하지 못했어요. 다시 시도해 주세요.</span>}
    </section>
  );
}

function IntroductionSection({ user }: { user: User }) {
  const field = useProfileField(user.introduction, authActions.updateIntroduction);

  return (
    <section className="mp-section">
      <div className="mp-head">
        <span className="mp-head-title">자기소개</span>
        <span className="mp-head-desc">나를 짧게 소개해 보세요. 비워 두고 저장하면 자기소개가 지워져요.</span>
      </div>
      <form
        className="mp-multiline-form"
        onSubmit={(e) => {
          e.preventDefault();
          void field.submit();
        }}
      >
        <label className="mp-field is-multiline">
          <textarea
            value={field.value}
            maxLength={INTRODUCTION_MAX}
            rows={4}
            placeholder="자기소개를 입력하세요"
            aria-label="자기소개"
            onChange={(e) => field.change(e.target.value)}
          />
          <span className="meta mp-field-count">
            {field.value.length}/{INTRODUCTION_MAX}
          </span>
        </label>
        <div className="mp-field-actions">
          <Button type="submit" size="lg" disabled={field.unchanged || field.saving}>
            저장
          </Button>
        </div>
      </form>
      {field.result === 'saved' && (
        <span className="mp-field-hint">{field.trimmed ? '자기소개를 저장했어요.' : '자기소개를 지웠어요.'}</span>
      )}
      {field.result === 'failed' && <span className="mp-field-hint is-error">자기소개를 저장하지 못했어요. 다시 시도해 주세요.</span>}
    </section>
  );
}

function AccountSection({ user }: { user: User }) {
  const router = useRouter();
  return (
    <section className="mp-section">
      <span className="mp-head-title">계정</span>
      <div className="mp-account">
        <span className="google-mark google-mark-lg">G</span>
        <div className="mp-account-info">
          <span className="mp-account-email">{user.email}</span>
          <span className="meta">Google 계정으로 로그인됨</span>
        </div>
        <Button
          variant="secondary"
          icon={LogOut}
          onClick={async () => {
            await authActions.signOut();
            router.replace('/login');
          }}
        >
          로그아웃
        </Button>
      </div>
    </section>
  );
}
