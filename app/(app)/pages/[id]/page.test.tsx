import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nav } from '@/test/navigation';
import { loadStore } from '@/test/store';

vi.mock('next/navigation', () => import('@/test/navigation'));

async function renderPage({ content }: { content: string }) {
  localStorage.setItem(
    'mini-notion:v1',
    JSON.stringify({ pages: [{ id: 'p1', title: '', content, createdAt: 1, updatedAt: 1 }] }),
  );
  await loadStore();
  nav.params = { id: 'p1' };
  const { default: PageDetail } = await import('./page');
  render(<PageDetail />);
}

/** jsdom's real quota is 5,000,000 code units across keys and values. Leave just a few free. */
function fillStorageAlmostFull() {
  let used = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    used += key.length + localStorage.getItem(key)!.length;
  }
  localStorage.setItem('filler', 'x'.repeat(5_000_000 - used - 'filler'.length - 4));
}

const contentBox = () => screen.getByRole('textbox', { name: '내용' });
const charCount = () => contentBox().nextElementSibling;

afterEach(() => {
  vi.useRealTimers();
});

describe('글 상세 — 내용 글자 수', () => {
  it('shows the saved content count right below the content box on first render', async () => {
    await renderPage({ content: '안녕하세요' });
    expect(charCount()).toHaveTextContent(/^공백 포함 5자/);
  });

  it('shows 0 for an empty page', async () => {
    await renderPage({ content: '' });
    expect(charCount()).toHaveTextContent(/^공백 포함 0자/);
  });

  it('updates immediately while typing, deleting and pasting, without waiting for autosave', async () => {
    const user = userEvent.setup();
    await renderPage({ content: '' });

    await user.type(contentBox(), '안녕하세요');
    expect(charCount()).toHaveTextContent(/^공백 포함 5자/);

    await user.type(contentBox(), '{Backspace}');
    expect(charCount()).toHaveTextContent(/^공백 포함 4자/);

    await user.clear(contentBox());
    await user.paste('가 나');
    expect(charCount()).toHaveTextContent(/^공백 포함 3자/);
  });

  it('ignores the title', async () => {
    const user = userEvent.setup();
    await renderPage({ content: '가나' });

    await user.type(screen.getByRole('textbox', { name: '제목' }), '제목입니다');

    expect(charCount()).toHaveTextContent(/^공백 포함 2자/);
  });

  it('stays accurate after autosave fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderPage({ content: '' });
    fillStorageAlmostFull();

    await user.type(contentBox(), '안녕');
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(screen.getByRole('alert')).toHaveTextContent('저장 실패');
    expect(charCount()).toHaveTextContent(/^공백 포함 2자/);
  });

  it('describes the content box without announcing every keystroke', async () => {
    await renderPage({ content: '가' });
    const count = charCount()!;

    expect(count.id).not.toBe('');
    expect(contentBox()).toHaveAttribute('aria-describedby', count.id);
    expect(count).not.toHaveAttribute('aria-live');
    expect(count).not.toHaveAttribute('role');
  });

  it.each([
    ['가 나', '공백 포함 3자 · 공백 제외 2자'],
    ['', '공백 포함 0자 · 공백 제외 0자'],
  ])('shows both counts for %j', async (content, expected) => {
    await renderPage({ content });
    expect(charCount()!.textContent).toBe(expected);
  });

  it('treats a typed line break as whitespace', async () => {
    const user = userEvent.setup();
    await renderPage({ content: '' });

    await user.type(contentBox(), '가{Enter}나');

    expect(charCount()!.textContent).toBe('공백 포함 3자 · 공백 제외 2자');
  });
});

describe('글 상세 — 고양이 커버', () => {
  const cover = () => screen.getByTestId('page-cover');
  const coverImage = () => cover().querySelector('img');

  it('sits above the title and starts as a skeleton while the cat photo is requested', async () => {
    await renderPage({ content: '' });

    const title = screen.getByRole('textbox', { name: '제목' });
    expect(cover().compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cover()).toHaveAttribute('data-state', 'loading');
    expect(coverImage()!.getAttribute('src')).toMatch(/^https:\/\/cataas\.com\/cat\/cute\?/);
  });

  it('shows the photo once it loads', async () => {
    await renderPage({ content: '' });

    fireEvent.load(coverImage()!);

    expect(cover()).toHaveAttribute('data-state', 'loaded');
    expect(coverImage()).not.toBeNull();
  });

  it('falls back to a plain cover without a broken image when the request fails', async () => {
    await renderPage({ content: '' });

    fireEvent.error(coverImage()!);

    expect(cover()).toHaveAttribute('data-state', 'failed');
    expect(coverImage()).toBeNull();
  });

  it('gives up after 10 seconds instead of shimmering forever', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderPage({ content: '' });

    await act(() => vi.advanceTimersByTimeAsync(9_999));
    expect(cover()).toHaveAttribute('data-state', 'loading');

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(cover()).toHaveAttribute('data-state', 'failed');
    expect(coverImage()).toBeNull();
  });

  it('does not time out a photo that already loaded', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderPage({ content: '' });

    fireEvent.load(coverImage()!);
    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(cover()).toHaveAttribute('data-state', 'loaded');
  });

  it('requests a new random cat each time the page is opened', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(1_000);
    await renderPage({ content: '' });
    const first = coverImage()!.getAttribute('src');

    cleanup();
    vi.setSystemTime(2_000);
    await renderPage({ content: '' });

    expect(coverImage()!.getAttribute('src')).not.toBe(first);
  });

  it('is decorative and hidden from screen readers', async () => {
    await renderPage({ content: '' });

    expect(cover()).toHaveAttribute('aria-hidden', 'true');
    expect(coverImage()).toHaveAttribute('alt', '');
  });

  it('keeps the title focused on a new page while the cover loads', async () => {
    await renderPage({ content: '' });

    expect(screen.getByRole('textbox', { name: '제목' })).toHaveFocus();
  });
});
