import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { loadStore } from '@/test/store';
import { db, pageRow, SIGNED_IN_USER } from '@/test/supabase';


async function renderStore() {
  const store = await loadStore();
  const hook = renderHook(() => store.useStore());
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  return { ...store, result: hook.result };
}

describe('글 저장소 (Supabase page 테이블)', () => {
  it('lists only the signed-in user’s pages, newest first', async () => {
    db.rows.push(
      pageRow({ id: 'old', title: '예전 글', created_at: '2026-10-01T00:00:00Z' }),
      pageRow({ id: 'other', title: '남의 글', user_id: 'user-2' }),
      pageRow({ id: 'new', title: '새 글', created_at: '2026-10-11T00:00:00Z' }),
    );

    const { result } = await renderStore();

    expect(result.current.pages.map((p) => p.id)).toEqual(['new', 'old']);
    expect(result.current.pages[0]).toMatchObject({ title: '새 글', createdAt: Date.parse('2026-10-11T00:00:00Z') });
  });

  it('creates a page owned by the signed-in user and puts it on top', async () => {
    db.rows.push(pageRow({ id: 'old' }));
    const { actions, result } = await renderStore();

    let created!: Awaited<ReturnType<typeof actions.createPage>>;
    await act(async () => {
      created = await actions.createPage();
    });

    expect(db.rows.find((r) => r.id === created.id)).toMatchObject({ user_id: SIGNED_IN_USER, title: '', content: '' });
    expect(result.current.pages.map((p) => p.id)).toEqual([created.id, 'old']);
  });

  it('saves title and content edits', async () => {
    db.rows.push(pageRow({ id: 'p1' }));
    const { actions, result } = await renderStore();

    await act(() => actions.updatePage('p1', { title: '제목', content: '내용' }));

    expect(db.rows[0]).toMatchObject({ title: '제목', content: '내용' });
    expect(result.current.pages[0]).toMatchObject({ title: '제목', content: '내용' });
  });

  it('deletes the user’s own page', async () => {
    db.rows.push(pageRow({ id: 'p1' }), pageRow({ id: 'p2' }));
    const { actions, result } = await renderStore();

    await act(() => actions.deletePage('p1'));

    expect(db.rows.map((r) => r.id)).toEqual(['p2']);
    expect(result.current.pages.map((p) => p.id)).toEqual(['p2']);
  });

  it('never deletes or edits another user’s page', async () => {
    db.rows.push(pageRow({ id: 'theirs', title: '남의 글', user_id: 'user-2' }));
    const { actions } = await renderStore();

    await act(() => actions.deletePage('theirs'));
    await expect(actions.updatePage('theirs', { title: '바꿈', content: '' })).rejects.toThrow();

    expect(db.rows).toEqual([expect.objectContaining({ id: 'theirs', title: '남의 글' })]);
  });

  it('throws when a request fails so the screen can show its error state', async () => {
    db.rows.push(pageRow({ id: 'p1' }));
    const { actions, result } = await renderStore();
    db.fail.insert = true;
    db.fail.delete = true;

    await expect(actions.createPage()).rejects.toThrow();
    await expect(actions.deletePage('p1')).rejects.toThrow();
    expect(result.current.pages.map((p) => p.id)).toEqual(['p1']);
  });

  it('reports a failed list load and recovers on reload', async () => {
    db.rows.push(pageRow({ id: 'p1' }));
    db.fail.select = true;
    const { actions, result } = await renderStore();
    expect(result.current).toMatchObject({ failed: true, pages: [] });

    db.fail.select = false;
    await act(() => actions.reload());

    expect(result.current).toMatchObject({ ready: true, failed: false });
    expect(result.current.pages.map((p) => p.id)).toEqual(['p1']);
  });

  it('starts empty when signed out', async () => {
    db.userId = null;
    db.rows.push(pageRow({ id: 'p1' }));

    const { actions, result } = await renderStore();

    expect(result.current.pages).toEqual([]);
    await expect(actions.createPage()).rejects.toThrow();
  });
});
