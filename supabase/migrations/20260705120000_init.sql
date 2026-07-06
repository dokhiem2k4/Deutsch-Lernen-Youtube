-- F02 — 001 init: schema + RLS + trigger (Blueprint §3)

-- ===== Tables =====
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  nickname   text,
  created_at timestamptz not null default now()
);

create table if not exists public.vocabulary (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  word       text not null,
  lemma      text,
  article    text,               -- der/die/das/null
  meaning_vi text,
  example    text,
  learned_at timestamptz,         -- null = "Từ mới"
  created_at timestamptz not null default now(),
  unique (user_id, word)          -- idempotent lưu từ
);
create index if not exists vocabulary_user_id_idx on public.vocabulary(user_id);

create table if not exists public.ai_meaning_cache (
  id           uuid primary key default gen_random_uuid(),
  word         text not null,
  context_hash text not null,
  lemma        text,
  article      text,
  meaning_vi   text,
  created_at   timestamptz not null default now(),
  unique (word, context_hash)     -- cache theo (word, ngữ cảnh)
);

-- ===== RLS =====
alter table public.profiles         enable row level security;
alter table public.vocabulary       enable row level security;
alter table public.ai_meaning_cache enable row level security;

-- profiles: chỉ chủ sở hữu
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- vocabulary: chỉ chủ sở hữu (S/I/U/D)
create policy "vocabulary_select_own" on public.vocabulary
  for select using (user_id = auth.uid());
create policy "vocabulary_insert_own" on public.vocabulary
  for insert with check (user_id = auth.uid());
create policy "vocabulary_update_own" on public.vocabulary
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "vocabulary_delete_own" on public.vocabulary
  for delete using (user_id = auth.uid());

-- ai_meaning_cache: RLS bật, KHÔNG policy cho authenticated → client không đọc/ghi trực tiếp;
-- chỉ Route Handler dùng service_role (bypass RLS) mới truy cập (cache dùng chung mọi user).

-- ===== Trigger: tạo profile khi có auth user mới =====
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
