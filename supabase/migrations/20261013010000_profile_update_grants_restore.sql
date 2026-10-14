-- profile의 컬럼 수정 권한을 마이그레이션에 적힌 상태로 되돌린다.
-- 원격 DB에서 name·introduction의 UPDATE 권한이 빠져(image_path만 남음) 별명·자기소개 저장이
-- "permission denied for table profile"(42501)로 실패했다. 컬럼은 다시 만들어지지 않았으므로
-- 마이그레이션 밖에서 테이블 단위 revoke가 실행된 것으로 보인다(테이블 revoke는 컬럼 권한도 지운다).
-- grant는 여러 번 실행해도 안전하다.

grant update (name, introduction, image_path) on public.profile to authenticated;
