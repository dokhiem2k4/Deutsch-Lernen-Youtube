# Progress — Deutsch Lernen

> Cập nhật mỗi khi feature đổi trạng thái. `done` phải kèm **bằng chứng** (output lệnh/test).

## Current State
- **Last Updated:** 2026-07-06.
- **Phase:** BUILD. F01 + F02 + F03 **done** → active `F04`.
- **Current Objective / Active feature:** `F04 — API core (vocabulary + lookup-context AI + dashboard)`.
- **What đã build:** scaffold (F01) + Supabase DB live (F02) + Web auth (F03): login Google, AuthGuard, `GET /api/me` (Bearer JWT, 401 verified), lib supabase client/server + cors + apiClient, hooks/useUser, /dashboard placeholder.
- **Blockers:**
  - **Google OAuth** chưa bật (Homeowner: Blueprint §10.2, redirect `https://ealcahjaftwrllbudkyr.supabase.co/auth/v1/callback`) → cần để verify login thật + path /api/me token-hợp-lệ.
  - **`OPENAI_API_KEY` trống** → cần cho F04 lookup-context (điền vào `.env` + `web/.env.local`).
- **Recommended Next Step:** F04 — viết /api/vocabulary (CRUD idempotent), mark-learned, lookup-context (cache→gpt-4o-mini), /api/dashboard (RPC). Dùng lại `getUserFromRequest` + `corsHeaders` từ F03.

## Feature board (nguồn: feature_list.json)
| ID | Feature | Deps | Status |
|----|---------|------|--------|
| F01 | Scaffold monorepo | — | done ✓ |
| F02 | Supabase migrations + RLS + RPC | F01 | done ✓ |
| F03 | Web auth (Google + AuthGuard + /api/me) | F01,F02 | done ✓ (login chờ Homeowner OAuth) |
| F04 | API core (vocab + lookup AI + dashboard) | F03 | pending ◀ active |
| F04 | API core (vocab + lookup AI + dashboard) | F03 | pending |
| F05 | Web pages (tu-vung/flashcard/quiz/dashboard) | F04 | pending |
| F06 | Extension scaffold (MV3 + auth-bridge + popup) | F04 | pending |
| F07 | Extension subtitles (intercept + overlay) | F06 | pending |
| F08 | Extension click-word (lookup + save + settings) | F07 | pending |
| F09 | SHIP + verify tổng + handover | F05,F08 | pending |

## Nhật ký (mới nhất trên cùng)
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
