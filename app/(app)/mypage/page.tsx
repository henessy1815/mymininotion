'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { CircleAlert, LogOut, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ds';
import { UserAvatar } from '@/components/shell';
import { actions, useStore, type User } from '@/lib/store';

const NICKNAME_MAX = 20;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_PX = 256;

/** 1g 마이 페이지 */
export default function MyPage() {
  const { user } = useStore();
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
            <AccountSection user={user} />
          </div>
        </div>
      </div>
    </>
  );
}

function AvatarSection({ user }: { user: User }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('JPG, PNG, WEBP 형식의 이미지만 올릴 수 있어요.');
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError(`5MB 이하의 이미지만 올릴 수 있어요. 선택한 파일은 ${(file.size / 1024 / 1024).toFixed(1)}MB예요.`);
      return;
    }
    setBusy(true);
    try {
      actions.updateProfile({ avatarUrl: await toAvatarDataUrl(file) });
    } catch {
      setError('이미지를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mp-section">
      <div className="mp-head">
        <span className="mp-head-title">프로필 이미지</span>
        <span className="mp-head-desc">JPG · PNG · WEBP, 최대 5MB</span>
      </div>
      <div className="mp-avatar-row">
        <UserAvatar user={user} size={80} />
        <div className="mp-avatar-actions">
          <Button variant="secondary" icon={Upload} disabled={busy} onClick={() => fileRef.current?.click()}>
            이미지 변경
          </Button>
          <Button
            variant="ghost"
            icon={RotateCcw}
            disabled={!user.avatarUrl}
            onClick={() => {
              setError('');
              actions.updateProfile({ avatarUrl: null });
            }}
          >
            기본 이미지로
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      {error && (
        <div className="alert" role="alert" style={{ alignItems: 'center' }}>
          <span className="alert-icon" style={{ paddingTop: 0 }}>
            <CircleAlert size={16} />
          </span>
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}

function NicknameSection({ user }: { user: User }) {
  const [value, setValue] = useState(user.nickname);
  const [savedMsg, setSavedMsg] = useState(false);
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
        onSubmit={(e) => {
          e.preventDefault();
          if (invalid || unchanged) return;
          actions.updateProfile({ nickname: trimmed });
          setValue(trimmed);
          setSavedMsg(true);
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
            }}
          />
          <span className="meta">
            {value.length}/{NICKNAME_MAX}
          </span>
        </label>
        <Button type="submit" size="lg" disabled={invalid || unchanged}>
          저장
        </Button>
      </form>
      {invalid && <span className="mp-field-hint is-error">별명을 입력해 주세요. 공백만으로는 저장할 수 없어요.</span>}
      {savedMsg && !invalid && <span className="mp-field-hint">별명을 저장했어요.</span>}
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
          onClick={() => {
            actions.signOut();
            router.replace('/login');
          }}
        >
          로그아웃
        </Button>
      </div>
    </section>
  );
}

/** Center-crops and downsizes so the image fits comfortably in localStorage. */
async function toAvatarDataUrl(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = AVATAR_PX;
  canvas.getContext('2d')!.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_PX,
    AVATAR_PX,
  );
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}
