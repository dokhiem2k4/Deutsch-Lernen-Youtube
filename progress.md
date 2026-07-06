# Progress — Deutsch Lernen

> Cập nhật mỗi khi feature đổi trạng thái. `done` phải kèm **bằng chứng** (output lệnh/test).

## Current State
- **Last Updated:** 2026-07-06.
- **Phase:** BUILD. F01 + F02 + F03 + F04 **done** → active `F05`.
- **Current Objective / Active feature:** `F05 — Web pages (tu-vung/flashcard/quiz/dashboard)`.
- **What đã build:** scaffold (F01) + Supabase DB live (F02) + Web auth (F03) + **API core (F04)**: 4 route (`/api/vocabulary` GET/POST idempotent/DELETE, `/api/vocabulary/mark-learned`, `/api/lookup-context` cache→gpt-4o-mini→fallback, `/api/dashboard` RPC) + 2 lib (`supabaseAdmin` service_role, `openai` lookupWord). Tái dùng `getUserFromRequest`+`corsHeaders`.
- **Blockers:**
  - **Google OAuth** chưa bật (Homeowner: Blueprint §10.2, redirect `https://ealcahjaftwrllbudkyr.supabase.co/auth/v1/callback`) → cần để verify login thật + path /api/me token-hợp-lệ.
  - **`OPENAI_API_KEY` trống** → F04 path `source:"cache"`/`source:"openai"` (gọi AI thật) **chờ Homeowner** điền key. Fallback `source:"error"` đã verify không 500.
- **Recommended Next Step:** F05 — trang `/tu-vung` (list+xoá+trạng thái), `/hoc-tu-vung` flashcard (mark-learned), quiz 2 chiều (`QuizGame` direction, <4 từ chặn), `/dashboard` streak+chart 30 ngày. Gọi API F04 qua `apiClient`.

## Feature board (nguồn: feature_list.json)
| ID | Feature | Deps | Status |
|----|---------|------|--------|
| F01 | Scaffold monorepo | — | done ✓ |
| F02 | Supabase migrations + RLS + RPC | F01 | done ✓ |
| F03 | Web auth (Google + AuthGuard + /api/me) | F01,F02 | done ✓ (login chờ Homeowner OAuth) |
| F04 | API core (vocab + lookup AI + dashboard) | F03 | done ✓ (AI-call path chờ Homeowner OPENAI key) |
| F05 | Web pages (tu-vung/flashcard/quiz/dashboard) | F04 | pending ◀ active |
| F06 | Extension scaffold (MV3 + auth-bridge + popup) | F04 | pending |
| F07 | Extension subtitles (intercept + overlay) | F06 | pending |
| F08 | Extension click-word (lookup + save + settings) | F07 | pending |
| F09 | SHIP + verify tổng + handover | F05,F08 | pending |

## Nhật ký (mới nhất trên cùng)
### 2026-07-06 — F04 API core (DONE) [Chủ thầu giao TIP → Thợ làm]
- TIP: `.claude/tips/TIP-F04-api-core.md`. Kiến trúc chốt: vocab/mark-learned/dashboard qua scoped-JWT (RLS); lookup-context verify user (401) rồi cache+OpenAI bằng service_role; user_id luôn từ JWT.
- Files (web): `lib/supabaseAdmin.ts` (service_role, server-only), `lib/openai.ts` (lookupWord gpt-4o-mini, ép JSON schema, validate article, prompt-injection guard), `app/api/vocabulary/route.ts` (GET/POST idempotent/DELETE/OPTIONS), `app/api/vocabulary/mark-learned/route.ts`, `app/api/lookup-context/route.ts` (cache→AI→cache, fallback không 500), `app/api/dashboard/route.ts`.
- **Bằng chứng runtime (server prod thật, user test tạo qua service_role rồi xoá):**
  - 401 sweep 6 route không token → **401**; `/api/health` → 200 (xem block dưới).
  - POST idempotent: dup "Haus" → **cùng id, meaning_vi KHÔNG bị overwrite** ("ngôi nhà" giữ nguyên).
  - Spoof `user_id` trong body → bị bỏ qua (dùng user.id từ JWT).
  - mark-learned `[]` → no-op 200; `[id]` → `learned_at` set (verify GET).
  - GET order newest-first đúng; DELETE của mình → biến mất, count giảm.
  - **lookup-context fallback (OPENAI trống): 200 `source:"error"`, `meaning_vi:""` — KHÔNG 500** (invariant chính).
  - lookup thiếu sentence → 400; dashboard → 200 đủ 5 khoá + chart[30].
  - CORS: OPTIONS chrome-extension → 204 ACAO phản chiếu; origin lạ → không ACAO; **không `*`** trên mọi route.
  - `./init.sh web` VERIFY OK; `./init.sh secret` = 0 secret.
- **Chờ Homeowner:** điền `OPENAI_API_KEY` → verify `source:"cache"`/`source:"openai"` (gọi AI thật). Fallback đã xong.
- Deviations: mark-learned dùng `new Date().toISOString()` (giờ server) thay `now()` DB — supabase-js không set now() trực tiếp; kết quả tương đương.

### 2026-07-06 — F03 Web auth (DONE, code-complete) [Chủ thầu giao TIP → Thợ làm]
- TIP: `.claude/tips/TIP-F03-web-auth.md`. Chốt kiến trúc: session localStorage (không cookie/SSR) + API Bearer JWT stateless.
- Files (web): `lib/{supabaseClient,supabaseServer,cors,apiClient}.ts`, `hooks/useUser.ts`, `components/AuthGuard.tsx`, `app/page.tsx` (nút Google), `app/auth/callback/page.tsx`, `app/dashboard/page.tsx` (placeholder), `app/api/me/route.ts`. Thêm dep `@supabase/supabase-js`.
- **Bằng chứng (runtime curl, server thật):** /api/me không token → **401** `{"error":"unauthorized"}`; token sai → 401; OPTIONS Origin chrome-extension → 204 + ACAO phản chiếu (không `*`); OPTIONS origin lạ → không ACAO. `./init.sh web` VERIFY OK.
- Fix: đổi `<a>` nội bộ → `next/link` (ESLint no-html-link-for-pages).
- **Chờ Homeowner:** path token-hợp-lệ (200 profile) + login Google thật cần bật Google OAuth. `/api/me` KHÔNG dùng service_role (đúng spec).

### 2026-07-06 — F02 Supabase migrations (DONE)
- Tạo project Supabase `deutsch-lernen` ref **ealcahjaftwrllbudkyr** (org DeutschLernen `iphytjwzblypdkpwuydh`, ap-southeast-1, free plan $0) qua Management API (MCP chưa nạp token kịp → dùng curl PAT).
- Apply 3 migration: `001_init` (profiles/vocabulary/ai_meaning_cache + RLS + trigger handle_new_user), `002_rpc` (get_dashboard), `003_harden_function_grants` (revoke execute khỏi public/anon).
- **Bằng chứng:** RLS bật cả 3 bảng; profiles 2 policy, vocabulary 4 policy, ai_meaning_cache 0 policy (đúng chủ đích); 2 func SECURITY DEFINER; trigger gắn auth.users; anon gọi get_dashboard → **401 permission denied** (REST test thật).
- **Advisors (security):** còn 2 mục INTENTIONAL (rls_enabled_no_policy trên cache; authenticated execute get_dashboard = thiết kế RPC). WARN public/anon-execute đã fix ở 003. 0 P0.
- `.env` + `web/.env.local` ghi URL+anon+service_role (gitignored — check-ignore pass).
- Deviations: dùng curl thay MCP (token nạp lúc restart nhưng chưa điền kịp). DB password lưu ở scratch (resettable ở dashboard).
- Chưa test được: cross-user RLS trên data thật (cần user auth → verify ở F03/F04 với Homeowner).

### 2026-07-05 — F01 Scaffold monorepo (DONE)
- Tạo: root `package.json` (workspaces web+extension), `.gitignore`, `.env.example`, `README.md`.
- `web/`: Next.js 15 App Router (layout, page, `app/api/health`, globals Tailwind v4, tsconfig, next.config.ts, eslint).
- `extension/`: MV3 (`manifest.json`) + `build.mjs` (esbuild, format iife, define chỉ inject PUBLIC env) + stubs service-worker/youtube/popup.
- `supabase/migrations/` (.gitkeep, chờ F02).
- **Bằng chứng:** `./init.sh all` → VERIFY OK (xem mục dưới). `npm install` sạch (343 pkg; 3 moderate vuln — theo dõi ở §9).
- Deviations: không có. Đã bỏ `next/font` Google để tránh phụ thuộc mạng lúc build (dùng font mặc định; Inter thêm ở F05).

### 2026-07-05 — Harness setup
- Tạo harness: `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`, `.claude/workflow/{pipeline,security}.md`.
- Bổ sung so với vibecode-kit: SHIP, MONITOR, adversarial VERIFY, SECURITY(STRIDE/OWASP), DevEx, Diataxis docs, guardrails (/careful,/freeze), secret-leak grep trong init.sh.
- Bằng chứng: N/A (chưa có code để verify).

## Verification Evidence (command and output — dán vào đây khi có)
### F04 — runtime (2026-07-06, `next start` :3123, user test service_role → xoá)
```
401 sweep (no token):
  GET/POST/DELETE /api/vocabulary          -> 401
  POST /api/vocabulary/mark-learned        -> 401
  POST /api/lookup-context                 -> 401
  GET  /api/dashboard                      -> 401
  GET  /api/health (public)                -> 200 {"status":"ok"}

authed (JWT từ signInWithPassword):
  GET vocabulary empty                     -> 200 []
  POST Haus #1                             -> 200 id=5ee7… article=das
  POST Haus #2 (dup, meaning khác)         -> 200 SAME id, meaning_vi="ngôi nhà" (KHÔNG overwrite)
  POST Buch {user_id spoof}                -> 200 (bỏ qua body user_id)
  mark-learned []                          -> 200 {"ok":true} (no-op)
  mark-learned [Haus]                      -> 200; GET: Haus.learned_at != null
  GET order                                -> newest-first (Buch trước)
  DELETE Buch                              -> 200 {"ok":true}; GET: has Buch=false, count=1
  lookup-context (OPENAI trống)            -> 200 source="error" meaning_vi="" (KHÔNG 500)
  lookup-context {word only}               -> 400 {"error":"word and sentence required"}
  dashboard                                -> 200 keys=[total_learned,total_words,streak,today_active,chart] chartLen=30

CORS:
  OPTIONS /api/vocabulary Origin chrome-extension://x -> 204; ACAO==origin
  OPTIONS /api/lookup-context Origin https://evil.com -> 204; (không ACAO)
  mọi route: KHÔNG "*"

./init.sh web -> VERIFY OK (build 8 routes)
./init.sh secret -> OK: 0 secret trong dist
```

### F03 — runtime curl (2026-07-06)
```
GET  /api/me                              -> 401 {"error":"unauthorized"}
GET  /api/me  Bearer invalid.token        -> 401
OPTIONS /api/me  Origin chrome-extension  -> 204; ACAO: chrome-extension://abcdef; ALLOW-HEADERS: Authorization, Content-Type
OPTIONS /api/me  Origin https://evil.com  -> (không ACAO — đúng)
./init.sh web -> VERIFY OK (build 6 routes: /, /api/health, /api/me, /auth/callback, /dashboard)
```

### F01 — `./init.sh all` (2026-07-05) → VERIFY OK (exit 0)
```
==> SCAFFOLD: package.json OK, .env.example OK, README.md OK
==> WEB: ✔ No ESLint warnings or errors; ▲ Next.js 15.5.20
    ✓ Compiled successfully in 7.6s; Linting/type-check OK; ✓ Generating static pages (5/5)
    Route: / (○ static), /api/health (ƒ dynamic), /_not-found
==> EXTENSION: esbuild -> dist/ (service-worker.js, youtube.js, popup.js, manifest.json, popup.html)
==> SECRET LEAK: OK: 0 secret trong dist
VERIFY OK (all)
```
