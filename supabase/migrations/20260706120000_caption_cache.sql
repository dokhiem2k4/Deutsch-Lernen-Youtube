-- F10 — cache dịch phụ đề DE→VI (server-side, dùng chung theo video). RLS bật, no-policy → chỉ service_role.
create table if not exists public.caption_translation_cache (
  id          uuid primary key default gen_random_uuid(),
  video_id    text not null,
  source_hash text not null,
  target_lang text not null default 'vi',
  cues        jsonb not null,               -- [{start,dur,text}] đã dịch
  created_at  timestamptz not null default now(),
  unique (video_id, source_hash, target_lang)
);

alter table public.caption_translation_cache enable row level security;
-- KHÔNG policy cho authenticated → client không đọc/ghi trực tiếp; chỉ Route Handler service_role.
