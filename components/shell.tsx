'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleUserRound, FileText, LayoutList, Search } from 'lucide-react';
import { Avatar, Button, Kbd, SearchPill, SidebarItem, SidebarSection } from './ds';
import { useStore, type User } from '@/lib/store';
import { displayTitle, formatDateTime } from '@/lib/format';

export function UserAvatar({ user, size }: { user: User; size: number }) {
  return <Avatar size={size} src={user.avatarUrl} initials={user.nickname.slice(0, 1)} bg="var(--purple-500)" />;
}

/** Redirects to /login when signed out (PRD #2), then renders the shell. */
export function AppShell({ children }: { children: ReactNode }) {
  const { ready, user, pages } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) return <div className="app" />;

  const recent = pages.filter((p) => p.title.trim()).slice(0, 5);

  return (
    <div className="app">
      <header className="topbar">
        <Link href="/" className="brand-pill">
          <span className="brand-mark">N</span>미니 노션
        </Link>
        <span className="spacer" />
        <SearchBox />
        <Link href="/mypage" className={`user-pill${pathname === '/mypage' ? ' is-selected' : ''}`}>
          <UserAvatar user={user} size={24} />
          {user.nickname}
        </Link>
      </header>
      <div className="app-body">
        <nav className="sidebar" aria-label="사이드바">
          <div className="sidebar-nav">
            <SidebarItem href="/" icon={LayoutList} label="업무 페이지" selected={pathname === '/'} />
            <SidebarItem href="/mypage" icon={CircleUserRound} label="마이 페이지" selected={pathname === '/mypage'} />
          </div>
          <SidebarSection title="최근 글">
            {recent.length === 0 ? (
              <div className="sidebar-empty">아직 작성한 글이 없어요</div>
            ) : (
              recent.map((p) => (
                <SidebarItem
                  key={p.id}
                  href={`/pages/${p.id}`}
                  icon={FileText}
                  label={p.title}
                  selected={pathname === `/pages/${p.id}`}
                />
              ))
            )}
          </SidebarSection>
          <div className="sidebar-hint">
            <Kbd>/page</Kbd>로 새 글 만들기
          </div>
        </nav>
        <main className="sheet">{children}</main>
      </div>
    </div>
  );
}

/** Title search (PRD #11). Collapsed pill on desktop; `expanded` renders the input directly (mobile). */
export function SearchBox({ expanded = false, onClose }: { expanded?: boolean; onClose?: () => void }) {
  const { pages } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(expanded);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const results = q ? pages.filter((p) => displayTitle(p.title).toLowerCase().includes(q)).slice(0, 8) : [];

  const close = () => {
    setQuery('');
    setActive(0);
    if (expanded) onClose?.();
    else setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node) && !expanded) {
        setQuery('');
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, expanded]);

  if (!open) return <SearchPill label="글 제목 검색" onClick={() => setOpen(true)} />;

  const go = (id: string) => {
    close();
    router.push(`/pages/${id}`);
  };

  return (
    <div className="search" ref={rootRef}>
      <div className="search-input-wrap">
        <Search size={15} />
        <input
          autoFocus
          value={query}
          placeholder="글 제목 검색"
          aria-label="글 제목 검색"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter' && results[active]) go(results[active].id);
          }}
        />
      </div>
      {q && (
        <div className="search-results" role="listbox">
          {results.length === 0 ? (
            <div className="search-results-empty">‘{query.trim()}’와 일치하는 글이 없어요</div>
          ) : (
            results.map((p, i) => (
              <Link
                key={p.id}
                href={`/pages/${p.id}`}
                onClick={close}
                className={`search-result${i === active ? ' is-active' : ''}`}
                role="option"
                aria-selected={i === active}
              >
                <FileText size={16} color="var(--text-tertiary)" />
                <span className="search-result-title">{displayTitle(p.title)}</span>
                <span className="meta">{formatDateTime(p.updatedAt)}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** 1f — delete confirmation. */
export function DeleteDialog({
  title,
  onCancel,
  onConfirm,
}: {
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <h2 className="dialog-title" id="delete-title">
          이 글을 삭제할까요?
        </h2>
        <p className="dialog-desc">‘{title}’ 글이 삭제됩니다. 삭제한 글은 복구할 수 없습니다.</p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} autoFocus>
            삭제
          </Button>
        </div>
      </div>
    </div>
  );
}
