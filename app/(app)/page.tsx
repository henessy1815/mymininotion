'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CircleAlert, File, FileText, Search, SquarePen, Trash2 } from 'lucide-react';
import { Button, IconButton, Kbd } from '@/components/ds';
import { DeleteDialog, SearchBox, UserAvatar } from '@/components/shell';
import { useAuth } from '@/lib/auth';
import { matchCommands } from '@/lib/commands';
import { actions, useStore, type Page } from '@/lib/store';
import { displayTitle, formatDateTime } from '@/lib/format';

/** 1c 업무 페이지 · 1d 글 없음 · 1h 모바일 */
export default function WorkspacePage() {
  const { user } = useAuth();
  const { ready, failed, pages } = useStore();
  const [searching, setSearching] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Page | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const closeDelete = () => {
    setPendingDelete(null);
    setDeleteFailed(false);
  };

  return (
    <>
      <div className="sheet-header">
        <span className="brand-mark m-only">N</span>
        <span className="sheet-title">업무</span>
        <span className="sheet-count d-only">{pages.length}</span>
        <span className="spacer" />
        {pages.length > 0 && <span className="meta d-only">최근 작성순</span>}
        <IconButton className="m-only" icon={Search} label="검색" size={44} iconSize={20} onClick={() => setSearching((s) => !s)} />
        {user && (
          <Link href="/mypage" className="m-only plain" aria-label="마이 페이지" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <UserAvatar user={user} size={28} />
          </Link>
        )}
      </div>
      {searching && (
        <div className="m-search m-only">
          <SearchBox expanded onClose={() => setSearching(false)} />
        </div>
      )}

      <div className="sheet-scroll">
        <div className="workspace">
          <div className="workspace-inner">
            <CommandInput />

            {!ready ? null : failed ? (
              <div className="alert list-alert" role="alert">
                <span className="alert-icon">
                  <CircleAlert size={16} />
                </span>
                <span className="alert-text">글 목록을 불러오지 못했어요. 다시 시도해 주세요.</span>
                <Button variant="secondary" size="sm" onClick={() => void actions.reload()}>
                  다시 시도
                </Button>
              </div>
            ) : pages.length === 0 ? (
              <div className="empty">
                <div className="empty-illust">
                  <FileText size={40} strokeWidth={1.5} />
                </div>
                <div className="empty-title">첫 글을 만들어 보세요</div>
                <div className="empty-desc">
                  입력창에<Kbd>/page</Kbd>를 입력하고 Enter를 누르면 새 글이 만들어져요.
                </div>
              </div>
            ) : (
              <ul className="page-list" style={{ listStyle: 'none', padding: 0 }}>
                {pages.map((p) => (
                  <li key={p.id} className="page-row">
                    <Link href={`/pages/${p.id}`} className="page-link">
                      <span className="page-link-icon" style={p.title.trim() ? undefined : { color: 'var(--text-placeholder)' }}>
                        {p.title.trim() ? <FileText size={18} /> : <File size={18} />}
                      </span>
                      <span className="page-link-body">
                        <span className={`page-link-title${p.title.trim() ? '' : ' is-untitled'}`}>{displayTitle(p.title)}</span>
                        <span className="meta">{formatDateTime(p.createdAt)}</span>
                      </span>
                    </Link>
                    <IconButton
                      className="page-row-delete"
                      icon={Trash2}
                      label="삭제"
                      size={30}
                      iconSize={16}
                      onClick={() => setPendingDelete(p)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {pendingDelete && (
        <DeleteDialog
          title={displayTitle(pendingDelete.title)}
          pending={deleting}
          error={deleteFailed ? '글을 삭제하지 못했어요. 다시 시도해 주세요.' : undefined}
          onCancel={closeDelete}
          onConfirm={async () => {
            setDeleting(true);
            setDeleteFailed(false);
            try {
              await actions.deletePage(pendingDelete.id);
              closeDelete();
            } catch {
              setDeleteFailed(true);
            } finally {
              setDeleting(false);
            }
          }}
        />
      )}
    </>
  );
}

/** `/page` + Enter → new page (PRD #4). Other text does not create a page. */
function CommandInput() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const matches = matchCommands(value);

  const run = async (index = 0) => {
    // A second Enter while the first is still saving would create a duplicate page.
    if (running) return;
    const exact = matches.find((c) => c.name === value.trim().toLowerCase());
    const cmd = exact ?? matches[index];
    if (!cmd) {
      if (value.trim()) setError('알 수 없는 명령어예요. /page를 입력해 새 글을 만들어 보세요.');
      return;
    }
    // Clearing closes the command menu, which would otherwise cover the error below the input.
    setValue('');
    setRunning(true);
    try {
      await cmd.run({ navigate: (href) => router.push(href) });
    } catch {
      setError(cmd.failMessage);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="command">
      <div className="command-box">
        <SquarePen size={18} />
        <input
          value={value}
          aria-label="명령어 입력"
          placeholder="/page를 입력하고 Enter를 눌러 새 글 만들기"
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) void run();
            if (e.key === 'Escape') setValue('');
          }}
        />
        <Kbd>Enter</Kbd>
      </div>
      {matches.length > 0 && (
        <div className="command-menu" role="listbox">
          <div className="command-menu-title">명령어</div>
          {matches.map((c, i) => (
            <button key={c.name} type="button" className={`command-item${i === 0 ? ' is-active' : ''}`} onClick={() => void run(i)}>
              <span className="command-item-icon">
                <c.icon size={16} />
              </span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: '600 14px/1.2 var(--font-sans)' }}>{c.name}</span>
                <span className="meta" style={{ color: 'var(--text-secondary)' }}>
                  {c.description}
                </span>
              </span>
              <Kbd>↵</Kbd>
            </button>
          ))}
        </div>
      )}
      {error && <div className="command-error">{error}</div>}
    </div>
  );
}
