-- 마이 페이지에서 본인 profile을 읽고 별명(name)을 바꿀 수 있게 한다.
-- 행 범위는 기존 RLS 정책(본인 profile 조회/수정)이 막고, 수정은 name 컬럼만 허용한다.

grant select on public.profile to authenticated;
grant update (name) on public.profile to authenticated;
