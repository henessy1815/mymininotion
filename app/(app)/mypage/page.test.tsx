import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/test/supabase';

vi.mock('next/navigation', () => import('@/test/navigation'));

beforeEach(() => {
  vi.resetModules();
});

async function renderPage() {
  const { default: MyPage } = await import('./page');
  render(<MyPage />);
  return screen.findByRole('textbox', { name: '자기소개' });
}

const saveButton = (field: HTMLElement) => field.closest('form')!.querySelector('button[type="submit"]')!;

describe('마이 페이지 — 자기소개', () => {
  it('shows the saved introduction and its length', async () => {
    db.profile.introduction = '기록을 좋아해요';
    const field = await renderPage();
    expect(field).toHaveValue('기록을 좋아해요');
    expect(screen.getByText('8/200')).toBeInTheDocument();
    expect(saveButton(field)).toBeDisabled();
  });

  it('shows an empty field when the introduction is null', async () => {
    const field = await renderPage();
    expect(field).toHaveValue('');
    expect(screen.getByText('0/200')).toBeInTheDocument();
  });

  it('saves a new introduction, trimmed, into profile.introduction', async () => {
    const field = await renderPage();
    await userEvent.type(field, '  안녕하세요  ');
    await userEvent.click(saveButton(field));
    expect(await screen.findByText('자기소개를 저장했어요.')).toBeInTheDocument();
    expect(db.profile.introduction).toBe('안녕하세요');
    expect(field).toHaveValue('안녕하세요');
    expect(saveButton(field)).toBeDisabled();
  });

  it('clears the introduction when saved empty', async () => {
    db.profile.introduction = '지울 소개';
    const field = await renderPage();
    await userEvent.clear(field);
    await userEvent.click(saveButton(field));
    expect(await screen.findByText('자기소개를 지웠어요.')).toBeInTheDocument();
    expect(db.profile.introduction).toBe('');
  });

  it('shows an error and keeps the input when saving fails', async () => {
    const field = await renderPage();
    db.fail.update = true;
    await userEvent.type(field, '새 소개');
    await userEvent.click(saveButton(field));
    expect(await screen.findByText('자기소개를 저장하지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument();
    expect(field).toHaveValue('새 소개');
    expect(saveButton(field)).toBeEnabled();
  });
});

describe('마이 페이지 — 프로필 이미지', () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL', 'https://storage.test/object/public/profile-image/');
  });

  async function renderAvatar() {
    await renderPage();
    return screen.getByLabelText('프로필 이미지 파일') as HTMLInputElement;
  }

  const image = (type = 'image/png', size = 1024) => new File([new Uint8Array(size)], 'me.png', { type });
  const avatarSrc = () => document.querySelector('.mp-avatar-row img')?.getAttribute('src');

  it('shows the stored image from the env base URL + profile.image_path', async () => {
    db.profile.image_path = 'old-image';
    await renderAvatar();
    expect(avatarSrc()).toBe('https://storage.test/object/public/profile-image/old-image');
    expect(screen.getByRole('button', { name: '사진 변경' })).toBeInTheDocument();
  });

  it('uploads under a uuidv4 name, saves only that path, and removes the previous file', async () => {
    db.profile.image_path = 'old-image';
    db.files.push('old-image');
    const input = await renderAvatar();
    await userEvent.upload(input, image());
    expect(await screen.findByText('프로필 이미지를 바꿨어요.')).toBeInTheDocument();
    expect(db.profile.image_path).toMatch(UUID);
    expect(db.files).toEqual([db.profile.image_path]);
    expect(avatarSrc()).toBe(`https://storage.test/object/public/profile-image/${db.profile.image_path}`);
  });

  it('rejects a file that is not JPG, PNG or WEBP without uploading', async () => {
    const input = await renderAvatar();
    await userEvent.upload(input, image('image/gif'), { applyAccept: false });
    expect(screen.getByText('JPG · PNG · WEBP 이미지만 올릴 수 있어요. 다른 사진을 골라 주세요.')).toBeInTheDocument();
    expect(db.files).toEqual([]);
  });

  it('rejects a file over 5MB without uploading', async () => {
    const input = await renderAvatar();
    await userEvent.upload(input, image('image/jpeg', 5 * 1024 * 1024 + 1));
    expect(screen.getByText('5MB 이하 사진만 올릴 수 있어요. 다른 사진을 골라 주세요.')).toBeInTheDocument();
    expect(db.files).toEqual([]);
  });

  it('keeps the previous image when the upload fails', async () => {
    db.profile.image_path = 'old-image';
    db.fail.upload = true;
    const input = await renderAvatar();
    await userEvent.upload(input, image());
    expect(await screen.findByText('프로필 이미지를 바꾸지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument();
    expect(db.profile.image_path).toBe('old-image');
  });

  it('removes the new file when saving the path fails', async () => {
    db.files.push('old-image');
    db.profile.image_path = 'old-image';
    const input = await renderAvatar();
    db.fail.update = true;
    await userEvent.upload(input, image());
    expect(await screen.findByText('프로필 이미지를 바꾸지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument();
    expect(db.files).toEqual(['old-image']);
    expect(db.profile.image_path).toBe('old-image');
  });
});
