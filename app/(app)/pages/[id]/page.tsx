'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, CircleAlert, FileX, LoaderCircle, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/ds';
import { DeleteDialog } from '@/components/shell';
import { actions, usePage, type Page } from '@/lib/store';
import { displayTitle, formatDate, formatDateTime } from '@/lib/format';

const AUTOSAVE_DELAY = 1000;

type SaveStatus = 'saving' | 'saved' | 'failed';

/** 1e 글 상세 · 1f 삭제 확인 · 1i 모바일 */
export default function PageDetail() {
  const { id } = useParams<{ id: string }>();
  const { ready, page } = usePage(id);
  const [deleted, setDeleted] = useState(false);

  if (!ready || deleted) return null;
  if (!page) return <NotFound />;
  return <Editor key={page.id} page={page} onDeleted={() => setDeleted(true)} />;
}

function Editor({ page, onDeleted }: { page: Page; onDeleted: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const draft = useRef({ title: page.title, content: page.content });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const save = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setStatus('saving');
    try {
      actions.updatePage(page.id, draft.current);
      setStatus('saved');
    } catch {
      setStatus('failed');
    }
  };

  const edit = (patch: Partial<typeof draft.current>) => {
    draft.current = { ...draft.current, ...patch };
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, AUTOSAVE_DELAY);
  };

  // Flush a pending save when leaving the page.
  useEffect(() => {
    const id = page.id;
    return () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      try {
        actions.updatePage(id, draft.current);
      } catch {
        // nothing to show once unmounted
      }
    };
  }, [page.id]);

  const remove = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    onDeleted();
    actions.deletePage(page.id);
    router.replace('/');
  };

  return (
    <>
      <div className="sheet-header is-compact">
        <Link href="/" className="icon-btn d-only" aria-label="업무로 돌아가기" title="업무로 돌아가기" style={{ width: 32, height: 32 }}>
          <ChevronLeft size={18} />
        </Link>
        <Link href="/" className="icon-btn m-only" aria-label="업무로 돌아가기" style={{ width: 44, height: 44 }}>
          <ChevronLeft size={22} />
        </Link>
        <Link href="/" className="crumb-parent d-only">
          업무
        </Link>
        <span className="crumb-sep d-only">/</span>
        <span className={`crumb-current d-only${title.trim() ? '' : ' is-untitled'}`}>{displayTitle(title)}</span>
        <span className="spacer" />
        <SaveState status={status} onRetry={save} />
        <span className="divider-v d-only" />
        <IconButton icon={Trash2} label="삭제" size={32} iconSize={17} active={confirmDelete} className="d-only" onClick={() => setConfirmDelete(true)} />
        <IconButton icon={Trash2} label="삭제" size={44} iconSize={19} className="m-only" onClick={() => setConfirmDelete(true)} />
      </div>

      <div className="sheet-scroll">
        <div className="editor-wrap">
          <div className="editor">
            <input
              className="editor-title"
              value={title}
              placeholder="제목 없음"
              aria-label="제목"
              autoFocus={!page.title && !page.content}
              onChange={(e) => {
                setTitle(e.target.value);
                edit({ title: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  bodyRef.current?.focus();
                }
              }}
            />
            <div className="meta editor-meta">
              {formatDateTime(page.updatedAt)} 수정<span className="d-only" style={{ display: 'inline' }}> · {formatDate(page.createdAt)} 생성</span>
            </div>
            <div className="editor-divider" />
            <textarea
              ref={bodyRef}
              className="editor-body"
              value={content}
              placeholder="내용을 입력하세요"
              aria-label="내용"
              onChange={(e) => {
                setContent(e.target.value);
                edit({ content: e.target.value });
              }}
            />
          </div>
        </div>
      </div>

      {confirmDelete && (
        <DeleteDialog title={displayTitle(title)} onCancel={() => setConfirmDelete(false)} onConfirm={remove} />
      )}
    </>
  );
}

function SaveState({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'saving')
    return (
      <span className="save-state" role="status">
        <LoaderCircle size={15} className="spin" />
        저장 중…
      </span>
    );
  if (status === 'saved')
    return (
      <span className="save-state" role="status">
        <Check size={15} />
        저장됨
      </span>
    );
  return (
    <span className="save-state is-failed" role="alert">
      <CircleAlert size={15} />
      저장 실패
      <Button variant="secondary" size="sm" onClick={onRetry}>
        다시 시도
      </Button>
    </span>
  );
}

function NotFound() {
  return (
    <div className="notfound">
      <FileX size={40} strokeWidth={1.5} color="var(--text-tertiary)" />
      <div style={{ font: 'var(--type-title)' }}>글을 찾을 수 없어요</div>
      <div style={{ font: 'var(--type-body)', color: 'var(--text-secondary)' }}>삭제되었거나 접근할 수 없는 글이에요.</div>
      <Link href="/" className="btn btn-secondary" style={{ textDecoration: 'none', marginTop: 8 }}>
        업무 페이지로
      </Link>
    </div>
  );
}
