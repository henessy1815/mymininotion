-- profile은 사용자가 만든 컬럼(id, created_at, name, user_id)만 쓴다.
-- 첫 로그인 때 auth.users 1:1로 profile을 만들고(user_id FK),
-- name 초기값은 auth.users의 Display Name(Google 이름)으로 넣는다.

alter table public.profile drop column avatar_url;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (user_id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
