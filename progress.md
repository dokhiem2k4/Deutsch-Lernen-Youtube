# Progress — Deutsch Lernen

> Cập nhật mỗi khi feature đổi trạng thái. `done` phải kèm **bằng chứng** (output lệnh/test).

## Current State
- **Last Updated:** 2026-07-06.
- **Phase:** BUILD. F01–F05 **done** → active `F06` (extension). Web MVP code-complete.
- **Current Objective / Active feature:** `F06 — Extension scaffold (MV3 + auth-bridge + popup)`.
- **What đã build:** scaffold (F01) + Supabase DB (F02) + Web auth (F03) + API core (F04) + **Web pages (F05)**: `/tu-vung` (list+xoá+Badge trạng thái), `/hoc-tu-vung` (flashcard lật + loa de-DE + mark-learned), `/kiem-tra-duc-viet` + `/kiem-tra-viet-duc` (`QuizGame` direction, <4 chặn), `/dashboard` (streak+3 stat+chart 30 ngày div thuần) + shared `lib/article`, `components/ui/{Button,Card,Badge,Spinner}`, `components/Header`.
- **Blockers:**
  - **Google OAuth** chưa bật (Homeowner: Blueprint §10.2, redirect `https://ealcahjaftwrllbudkyr.supabase.co/auth/v1/callback`) → cần để verify login thật + smoke test F05 trong browser (list/flashcard/quiz/dashboard end-to-end).
  - **`OPENAI_API_KEY` trống** → F04 path gọi AI thật chờ Homeowner. Không chặn F05/F06.
- **Recommended Next Step:** F06 — extension MV3: `manifest.json`, `background/service-worker` (SM_API proxy), `content/auth-bridge` (đọc session localStorage web), popup login/logout, lib chỉ chứa anon key. `./init.sh extension` + grep 0 secret. Chờ Chủ thầu giao TIP-F06.

## Feature board (nguồn: feature_list.json)
| ID | Feature | Deps | Status |
|----|---------|------|--------|
| F01 | Scaffold monorepo | — | done ✓ |
| F02 | Supabase migrations + RLS + RPC | F01 | done ✓ |
| F03 | Web auth (Google + AuthGuard + /api/me) | F01,F02 | done ✓ (login chờ Homeowner OAuth) |
| F04 | API core (vocab + lookup AI + dashboard) | F03 | done ✓ (AI-call path chờ Homeowner OPENAI key) |
| F05 | Web pages (tu-vung/flashcard/quiz/dashboard) | F04 | done ✓ (browser end-to-end chờ Homeowner OAuth) |
| F06 | Extension scaffold (MV3 + auth-bridge + popup) | F04 | pending ◀ active |
| F07 | Extension subtitles (intercept + overlay) | F06 | pending |
| F08 | Extension click-word (lookup + save + settings) | F07 | pending |
| F09 | SHIP + verify tổng + handover | F05,F08 | pending |

## Nhật ký (mới nhất trên cùng)
### 2026-07-06 — F05 Web pages (DONE) [Chủ thầu giao TIP → Thợ làm inline]
- TIP: `.claude/tips/TIP-F05-web-pages.md`. Thực thi **inline tuần tự** (không parallel-build): 4 trang nhỏ + chia sẻ type/QuizGame → cohesion UI + tiết kiệm token.
- Files (web): shared `lib/article.ts` (type Vocab + articleColor der=blue/die=pink/das=green/null=gray), `components/ui/{Button,Card,Badge,Spinner}.tsx`, `components/Header.tsx` (nav active + email + Đăng xuất); trang `app/tu-vung/page.tsx`, `app/hoc-tu-vung/page.tsx`, `components/QuizGame.tsx` (dùng chung, prop direction), `app/kiem-tra-duc-viet/page.tsx` + `app/kiem-tra-viet-duc/page.tsx`, thay `app/dashboard/page.tsx` (streak+3 stat+chart div thuần).
- Kiến trúc giữ đúng: không thêm dep (chart div/SVG thuần), articleColor, distractor = random từ vocab (không AI), flashcard lật → mark-learned, render as text (không innerHTML).
- **Bằng chứng runtime (`next start` :3124 + user test service_role rồi xoá):**
  - `./init.sh web` VERIFY OK — **0 ESLint warning/error** (đã bỏ `round` useMemo hack → giữ `questions` ở state), build 16 route (5 trang F05 static).
  - 5 trang serve **200** + shell AuthGuard "Đang tải…" (AuthGuard bọc mọi trang; chưa login → redirect client).
  - Data-contract khớp trang: seed 3 từ → quizPool 3 → **quiz BLOCKED (<4)**; seed 5 → **quiz RUNS (≥4)**, order newest-first.
  - `buildQuiz` (test trên pool thật): 5 câu, mỗi câu **4 option, chứa đáp án đúng, unique, distractor từ vocab**.
  - Flashcard: mark-learned 1 từ → `learned_at` set. Dashboard: total_words=5, learned=1, streak=1, chart[30], đủ 5 khoá. tu-vung DELETE → biến mất, count giảm.
  - Security greps: 0 `innerHTML`, không gọi supabase trực tiếp ở trang (chỉ Header `signOut`), chỉ `apiFetch`, `package.json` không đổi (0 dep mới).
- **Chờ Homeowner:** smoke test browser end-to-end (login Google → list/flashcard/quiz/dashboard hiển thị) cần bật OAuth. Logic + data-path đã verify qua user test.
- **Deviations:** feature_list §F05 scope có "article tô màu der/die/das" nhưng **TIP-F05 không liệt kê** → giữ đúng scope TIP. **Chủ thầu chốt:** "article tô màu" CHÍNH là `articleColor` đã làm (không có feature "bài đọc mẫu" nào — Thợ nhầm khái niệm). Không có gap, không cần F05.1.
- **VERIFY (Chủ thầu, adversarial-verify 13 agent):** 11/12 ok. **1 finding confidence HIGH (judge-confirmed):** QuizGame chọn distractor theo `id`, không dedup theo text → 2 từ đồng nghĩa (sehen/schauen = "nhìn") tạo 2 nút trùng chữ, bấm nút đúng-nhìn-thấy kia bị chấm SAI. **Đã vá:** `buildQuiz(pool, direction)` dedup distractor theo text hiển thị. Unit-test 5000 câu trên pool synonym → 0 bad (text unique + đúng 1 đáp án). `./init.sh web` xanh.

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
- **VERIFY (Chủ thầu, adversarial-verify 15 agent):** 13/14 ok. 1 finding (confidence low, tự judge vì 1 agent chết auth): `lookupWord` fetch **không timeout** → nếu OpenAI treo → hang → platform 5xx, vỡ invariant "không 500". **Đã vá:** AbortController 12s + `maxDuration=20` cho route. Re-verify runtime: lookup fallback vẫn **200 source:error** (không 500). Fix sync vào harness-kit template.

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
### F05 — runtime (2026-07-06, `next start` :3124, user test service_role → xoá)
```
./init.sh web -> VERIFY OK; ✔ No ESLint warnings or errors; build 16 routes
                 (5 F05 pages static: /tu-vung /hoc-tu-vung /kiem-tra-duc-viet /kiem-tra-viet-duc /dashboard)

page serve (no SSR crash):
  /tu-vung /hoc-tu-vung /kiem-tra-duc-viet /kiem-tra-viet-duc /dashboard -> 200 + AuthGuard "Đang tải…" shell

authed data-contract (JWT test user):
  seed 3 từ -> quizPool=3 -> quiz BLOCKED (<4) = true
  seed 5 từ -> quizPool=5 -> quiz RUNS (>=4) = true; order newest-first [Buch,laufen,Katze,Hund,Haus]
  buildQuiz(pool5): questions=5 each4opts=true containsAnswer=true uniqueOpts=true distractorsFromVocab=true
  flashcard flip: mark-learned "Buch" -> learned_at set = true
  dashboard: total_words=5 total_learned=1 streak=1 chartLen=30 (đủ 5 khoá)
  tu-vung delete -> gone=true count=4

security greps:
  dangerouslySetInnerHTML/innerHTML -> none
  supabase.* trong trang -> chỉ Header signOut (đúng)
  fetch trong trang -> chỉ apiFetch
  package.json -> unchanged (0 dep mới)
```

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
