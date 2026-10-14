-- 마이 페이지에서 프로필 이미지를 올리고 바꿀 수 있게 한다.
-- 이미지는 공개 버킷 profile-image 바로 아래에 uuidv4 파일명으로 올리고,
-- 버킷명 이후 경로(= 파일명)만 profile.image_path에 저장한다.
-- 앞부분(…/storage/v1/object/public/profile-image)은 앱 환경변수 NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL.
-- 버킷과 image_path 컬럼은 사용자가 만든 그대로 두고 제한·정책·권한만 추가한다.

-- 서버에서도 앱과 같은 제한(5MB, JPG·PNG·WEBP)을 건다.
update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'profile-image';

-- 공개 버킷이라 이미지 보기는 공개 URL로 하고 정책이 필요 없다.
-- 올리기는 로그인 사용자 누구나, 조회·삭제(이전 이미지 정리)는 본인이 올린 파일만.
-- storage의 remove()는 delete와 select 권한을 함께 요구한다.
drop policy if exists "프로필 이미지 업로드" on storage.objects;
create policy "프로필 이미지 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-image');

drop policy if exists "본인 프로필 이미지 조회" on storage.objects;
create policy "본인 프로필 이미지 조회" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-image' and owner_id = (select auth.uid()::text));

drop policy if exists "본인 프로필 이미지 삭제" on storage.objects;
create policy "본인 프로필 이미지 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-image' and owner_id = (select auth.uid()::text));

-- 행 범위는 기존 RLS 정책(본인 profile 수정)이 막고, 컬럼 수정 권한만 연다.
grant update (image_path) on public.profile to authenticated;
