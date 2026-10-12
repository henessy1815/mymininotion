import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => import('@/test/navigation'));

/** Double for the Supabase boundary: one signed-in user and their `profile` row. */
const supabase = vi.hoisted(() => ({
  row: { name: '고양이', introduction: null as string | null },
  update: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => {
  const client = {
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        cb('INITIAL_SESSION', { user: { id: 'u1', email: 'me@example.com', user_metadata: {} } });
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { ...supabase.row } }) }) }),
      update: (values: Record<string, unknown>) => ({
        eq: () => ({ select: () => ({ single: () => supabase.update(values) }) }),
      }),
    }),
  };
  return { createClient: () => client, getClient: () => client };
});

beforeEach(() => {
  vi.resetModules();
  supabase.row = { name: '고양이', introduction: null };
  supabase.update = vi.fn(async (values: Record<string, unknown>) => {
    Object.assign(supabase.row, values);
    return { data: { ...supabase.row }, error: null };
  });
});

async function renderPage() {
  const { default: MyPage } = await import('./page');
  render(<MyPage />);
  return screen.findByRole('textbox', { name: '자기소개' });
}

const saveButton = (field: HTMLElement) => field.closest('form')!.querySelector('button[type="submit"]')!;

describe('마이 페이지 — 자기소개', () => {
  it('shows the saved introduction and its length', async () => {
    supabase.row.introduction = '기록을 좋아해요';
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
    expect(supabase.update).toHaveBeenCalledWith({ introduction: '안녕하세요' });
    expect(await screen.findByText('자기소개를 저장했어요.')).toBeInTheDocument();
    expect(field).toHaveValue('안녕하세요');
    expect(saveButton(field)).toBeDisabled();
  });

  it('clears the introduction when saved empty', async () => {
    supabase.row.introduction = '지울 소개';
    const field = await renderPage();
    await userEvent.clear(field);
    await userEvent.click(saveButton(field));
    expect(supabase.update).toHaveBeenCalledWith({ introduction: '' });
    expect(await screen.findByText('자기소개를 지웠어요.')).toBeInTheDocument();
  });

  it('shows an error and keeps the input when saving fails', async () => {
    supabase.update = vi.fn(async () => ({ data: null, error: new Error('permission denied') }));
    const field = await renderPage();
    await userEvent.type(field, '새 소개');
    await userEvent.click(saveButton(field));
    expect(await screen.findByText('자기소개를 저장하지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument();
    expect(field).toHaveValue('새 소개');
    expect(saveButton(field)).toBeEnabled();
  });
});
