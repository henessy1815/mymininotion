-- 글(page): 로그인한 사용자가 등록하고, 자신의 글만 조회·수정·삭제할 수 있게 한다.
-- 테이블 구조(id, created_at, title, content, user_id)는 사용자가 만든 그대로 두고
-- RLS 정책과 권한만 추가한다.
-- user_id의 기본값은 auth.uid()가 아니므로 앱이 insert 때 user_id를 직접 보낸다(lib/store.ts).

-- 원격에 먼저 SQL로 적용된 적이 있어 다시 실행해도 안전하게 정책을 지우고 만든다.
alter table public.page enable row level security;

drop policy if exists "본인 page 조회" on public.page;
create policy "본인 page 조회" on public.page
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "본인 page 등록" on public.page;
create policy "본인 page 등록" on public.page
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "본인 page 수정" on public.page;
create policy "본인 page 수정" on public.page
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "본인 page 삭제" on public.page;
create policy "본인 page 삭제" on public.page
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 행 범위는 위 정책이 막는다. 컬럼 범위는 막지 않는다: 테이블 기본 UPDATE 권한이 남아 있어
-- 아래 컬럼 grant만으로는 제목·내용 외 컬럼 수정이 차단되지 않는다(앱은 제목·내용만 수정).
grant select, insert, delete on public.page to authenticated;
grant update (title, content) on public.page to authenticated;
