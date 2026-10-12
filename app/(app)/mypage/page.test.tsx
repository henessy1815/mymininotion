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
