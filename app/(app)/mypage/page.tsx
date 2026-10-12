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

function NicknameSection({ user }: { user: User }) {
  const [value, setValue] = useState(user.nickname);
  const [savedMsg, setSavedMsg] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const trimmed = value.trim();
  const invalid = trimmed.length === 0;
  const unchanged = trimmed === user.nickname;

  return (
    <section className="mp-section">
      <div className="mp-head">
        <span className="mp-head-title">별명</span>
        <span className="mp-head-desc">화면 상단 프로필에 표시돼요.</span>
      </div>
      <form
        className="mp-field-row"
        onSubmit={async (e) => {
          e.preventDefault();
          if (invalid || unchanged || saving) return;
          setSaving(true);
          setSaveFailed(false);
          try {
            await authActions.updateNickname(trimmed);
            setValue(trimmed);
            setSavedMsg(true);
          } catch {
            setSaveFailed(true);
          } finally {
            setSaving(false);
          }
        }}
      >
        <label className="mp-field">
          <input
            value={value}
            maxLength={NICKNAME_MAX}
            aria-label="별명"
            onChange={(e) => {
              setValue(e.target.value);
              setSavedMsg(false);
              setSaveFailed(false);
            }}
          />
          <span className="meta">
            {value.length}/{NICKNAME_MAX}
          </span>
        </label>
        <Button type="submit" size="lg" disabled={invalid || unchanged || saving}>
          저장
        </Button>
      </form>
      {invalid && <span className="mp-field-hint is-error">별명을 입력해 주세요. 공백만으로는 저장할 수 없어요.</span>}
      {savedMsg && !invalid && <span className="mp-field-hint">별명을 저장했어요.</span>}
      {saveFailed && <span className="mp-field-hint is-error">별명을 저장하지 못했어요. 다시 시도해 주세요.</span>}
    </section>
  );
}

function IntroductionSection({ user }: { user: User }) {
  const [value, setValue] = useState(user.introduction);
  const [savedMsg, setSavedMsg] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const trimmed = value.trim();
  const unchanged = trimmed === user.introduction;

  return (
    <section className="mp-section">
      <div className="mp-head">
        <span className="mp-head-title">자기소개</span>
        <span className="mp-head-desc">나를 짧게 소개해 보세요. 비워 두고 저장하면 자기소개가 지워져요.</span>
      </div>
      <form
        className="mp-multiline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (unchanged || saving) return;
          setSaving(true);
          setSaveFailed(false);
          try {
            await authActions.updateIntroduction(trimmed);
            setValue(trimmed);
            setSavedMsg(true);
          } catch {
            setSaveFailed(true);
          } finally {
            setSaving(false);
          }
        }}
      >
        <label className="mp-field is-multiline">
          <textarea
            value={value}
            maxLength={INTRODUCTION_MAX}
            rows={4}
            placeholder="자기소개를 입력하세요"
            aria-label="자기소개"
            onChange={(e) => {
              setValue(e.target.value);
              setSavedMsg(false);
              setSaveFailed(false);
            }}
          />
          <span className="meta mp-field-count">
            {value.length}/{INTRODUCTION_MAX}
          </span>
        </label>
        <div className="mp-field-actions">
          <Button type="submit" size="lg" disabled={unchanged || saving}>
            저장
          </Button>
        </div>
      </form>
      {savedMsg && <span className="mp-field-hint">{trimmed ? '자기소개를 저장했어요.' : '자기소개를 지웠어요.'}</span>}
      {saveFailed && <span className="mp-field-hint is-error">자기소개를 저장하지 못했어요. 다시 시도해 주세요.</span>}
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
