-- Google 로그인: 첫 로그인 때 구글 이름·프로필 사진으로 profile을 만들고(PRD #1),
-- 본인 profile만 읽고 고칠 수 있게 한다.

alter table public.profile
  add column avatar_url text,
  alter column user_id set default auth.uid(),
  alter column user_id set not null,
  add constraint profile_user_id_key unique (user_id),
  drop constraint profile_user_id_fkey,
  add constraint profile_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (user_id, name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), 20),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "본인 profile 조회" on public.profile
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "본인 profile 수정" on public.profile
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
