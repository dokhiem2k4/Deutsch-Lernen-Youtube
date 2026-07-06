-- F02 — 003 hardening: siết EXECUTE các SECURITY DEFINER function (advisor WARN).
-- Postgres mặc định grant EXECUTE cho PUBLIC → anon gọi được. Chỉ cho authenticated gọi get_dashboard.
revoke execute on function public.get_dashboard() from public;
revoke execute on function public.get_dashboard() from anon;
grant  execute on function public.get_dashboard() to authenticated;

-- handle_new_user chỉ chạy qua trigger (SECURITY DEFINER) — không cần ai gọi trực tiếp.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
