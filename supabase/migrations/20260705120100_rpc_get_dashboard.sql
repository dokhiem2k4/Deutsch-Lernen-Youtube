-- F02 — 002 rpc: get_dashboard (Blueprint §3). Compute-on-read, giờ VN (UTC+7).
create or replace function public.get_dashboard()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  tz  text := 'Asia/Ho_Chi_Minh';
  v_today        date := (now() at time zone tz)::date;
  v_total_words  int;
  v_total_learned int;
  v_today_active boolean;
  v_streak       int := 0;
  v_chart        json;
  activity_dates date[];
  d date;
begin
  if uid is null then
    return json_build_object('error', 'unauthorized');
  end if;

  select count(*) into v_total_words
    from public.vocabulary where user_id = uid;
  select count(*) into v_total_learned
    from public.vocabulary where user_id = uid and learned_at is not null;

  -- Tập ngày "có học" = ngày (VN) của created_at HOẶC learned_at
  select array_agg(distinct dt) into activity_dates from (
    select (created_at at time zone tz)::date as dt
      from public.vocabulary where user_id = uid
    union
    select (learned_at at time zone tz)::date
      from public.vocabulary where user_id = uid and learned_at is not null
  ) s;

  v_today_active := v_today = any(activity_dates);

  -- Streak: số ngày liên tiếp có hoạt động, kết thúc ở hôm nay (hoặc hôm qua nếu hôm nay chưa học).
  d := v_today;
  if not v_today_active then
    d := v_today - 1;   -- grace: streak vẫn tính tới hôm qua khi hôm nay chưa học
  end if;
  while d = any(activity_dates) loop
    v_streak := v_streak + 1;
    d := d - 1;
  end loop;

  -- Biểu đồ 30 ngày gần nhất: số từ có learned_at theo ngày (VN)
  select json_agg(json_build_object('date', to_char(t.d, 'YYYY-MM-DD'), 'count', t.count) order by t.d)
    into v_chart
  from (
    select g::date as d, coalesce(c.cnt, 0) as count
    from generate_series((v_today - 29)::timestamp, v_today::timestamp, interval '1 day') g
    left join (
      select (learned_at at time zone tz)::date as ld, count(*) as cnt
        from public.vocabulary
       where user_id = uid and learned_at is not null
       group by 1
    ) c on c.ld = g::date
  ) t;

  return json_build_object(
    'total_learned', v_total_learned,
    'total_words',   v_total_words,
    'streak',        v_streak,
    'today_active',  coalesce(v_today_active, false),
    'chart',         coalesce(v_chart, '[]'::json)
  );
end;
$$;

-- Cho phép user đã đăng nhập gọi RPC (SECURITY DEFINER lọc theo auth.uid())
grant execute on function public.get_dashboard() to authenticated;
