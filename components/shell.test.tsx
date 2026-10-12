import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => import('@/test/navigation'));
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ ready: true, user: { nickname: '테스터', email: 't@example.com', avatarUrl: null } }),
}));

async function renderShell() {
  const { AppShell } = await import('./shell');
  return render(<AppShell>본문</AppShell>);
}

const sidebar = () => screen.getByRole('navigation', { name: '사이드바' });

describe('사이드바 접기/펼치기', () => {
  it('collapses on the first click and expands on the second', async () => {
    const user = userEvent.setup();
    await renderShell();
    expect(sidebar()).not.toHaveClass('is-collapsed');

    await user.click(screen.getByRole('button', { name: '사이드바 접기' }));
    expect(sidebar()).toHaveClass('is-collapsed');
    const expand = screen.getByRole('button', { name: '사이드바 펼치기' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    // Nav links keep an accessible name while their labels are hidden.
    expect(screen.getByRole('link', { name: '업무 페이지' })).toBeInTheDocument();

    await user.click(expand);
    expect(sidebar()).not.toHaveClass('is-collapsed');
    expect(screen.getByRole('button', { name: '사이드바 접기' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('remembers the collapsed state on the next visit', async () => {
    const user = userEvent.setup();
    const { unmount } = await renderShell();
    await user.click(screen.getByRole('button', { name: '사이드바 접기' }));
    unmount();

    await renderShell();
    expect(sidebar()).toHaveClass('is-collapsed');
  });
});
