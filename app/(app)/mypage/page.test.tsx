import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => import('@/test/navigation'));

/** Double for the Supabase boundary: one signed-in user whose metadata holds the bio. */
const supabase = vi.hoisted(() => ({
  metadata: {} as Record<string, unknown>,
  updateUser: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        cb('INITIAL_SESSION', {
          user: { id: 'u1', email: 'me@example.com', user_metadata: supabase.metadata },
        });
        return { data: { subscription: { unsubscribe() {} } } };
      },
      updateUser: (...args: unknown[]) => supabase.updateUser(...args),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { name: '고양이' } }) }) }),
    }),
  }),
}));

beforeEach(() => {
  vi.resetModules();
  supabase.metadata = {};
  supabase.updateUser = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    data: { user: { user_metadata: { ...supabase.metadata, ...data } } },
    error: null,
  }));
});

async function renderPage() {
  const { default: MyPage } = await import('./page');
  render(<MyPage />);
  return screen.findByRole('textbox', { name: '자기소개' });
}

const saveButton = (bio: HTMLElement) => bio.closest('form')!.querySelector('button[type="submit"]')!;

describe('마이 페이지 — 자기소개', () => {
  it('shows the saved bio and its length', async () => {
    supabase.metadata = { bio: '기록을 좋아해요' };
    const bio = await renderPage();
    expect(bio).toHaveValue('기록을 좋아해요');
    expect(screen.getByText('8/200')).toBeInTheDocument();
    expect(saveButton(bio)).toBeDisabled();
  });

  it('saves a new bio, trimmed, into user metadata', async () => {
    const bio = await renderPage();
    await userEvent.type(bio, '  안녕하세요  ');
    await userEvent.click(saveButton(bio));
    expect(supabase.updateUser).toHaveBeenCalledWith({ data: { bio: '안녕하세요' } });
    expect(await screen.findByText('자기소개를 저장했어요.')).toBeInTheDocument();
    expect(bio).toHaveValue('안녕하세요');
    expect(saveButton(bio)).toBeDisabled();
  });

  it('clears the bio when saved empty', async () => {
    supabase.metadata = { bio: '지울 소개' };
    const bio = await renderPage();
    await userEvent.clear(bio);
    await userEvent.click(saveButton(bio));
    expect(supabase.updateUser).toHaveBeenCalledWith({ data: { bio: '' } });
    expect(await screen.findByText('자기소개를 지웠어요.')).toBeInTheDocument();
  });

  it('shows an error and keeps the input when saving fails', async () => {
    supabase.updateUser = vi.fn(async () => ({ data: { user: null }, error: new Error('network') }));
    const bio = await renderPage();
    await userEvent.type(bio, '새 소개');
    await userEvent.click(saveButton(bio));
    expect(await screen.findByText('자기소개를 저장하지 못했어요. 다시 시도해 주세요.')).toBeInTheDocument();
    expect(bio).toHaveValue('새 소개');
    expect(saveButton(bio)).toBeEnabled();
  });
});
