-- 마이 페이지에서 자기소개(introduction)도 바꿀 수 있게 한다.
-- 테이블 구조는 그대로 두고 컬럼 수정 권한만 연다. 행 범위는 기존 RLS 정책(본인 profile 수정)이 막는다.

grant update (introduction) on public.profile to authenticated;
