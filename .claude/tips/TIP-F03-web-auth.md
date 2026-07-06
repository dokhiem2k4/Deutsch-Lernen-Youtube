# TIP-F03 — Web auth (Google login + AuthGuard + /api/me)

> **Từ:** Chủ thầu (Contractor) · **Cho:** Thợ thi công (Builder)
> **Ngày giao:** 2026-07-06

## Header
- **Feature ID:** F03
- **Dependencies:** F01 (scaffold ✅), F02 (Supabase DB live ✅ — ref `ealcahjaftwrllbudkyr`)
- **Priority:** P0 (chặn F04/F05/F06)
- **Estimated effort:** M (~½ ngày)
- **Blueprint:** `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md` §1, §4 (`/api/me`), §6 (auth-bridge)
- **Invariants:** `CLAUDE.md` · **Security:** `.claude/workflow/security.md` (A01 authz, A05 CORS)

## Context
- **Working dir:** `web/`
- **Đã có:** Next.js 15 App Router chạy build; `web/.env.local` đã chứa `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`. `app/api/health/route.ts` (public) làm mẫu Route Handler.
- **DB đã sẵn:** bảng `profiles` (id/email/nickname) tự tạo qua trigger `handle_new_user` khi có auth user mới → **KHÔNG** tự insert profile trong code.
- **Cần cài thêm:** `@supabase/supabase-js` (dependency của workspace `web`).

## Task
Dựng luồng đăng nhập **Google OAuth** (qua Supabase) cho web, session lưu **localStorage**, cộng endpoint hồ sơ `GET /api/me` xác thực **Bearer JWT stateless**. Đây là nền cho mọi API sau (F04) và cho extension auth-bridge (F06).

### Quyết định kiến trúc (đã chốt — KHÔNG đổi, xung đột thì escalate):
- **Client session = `@supabase/supabase-js` browser client, storage = localStorage, flow = PKCE, `detectSessionInUrl: true`.** KHÔNG dùng `@supabase/ssr`/cookie (để extension đọc được `sb-<ref>-auth-token`).
- **API auth = Bearer JWT:** client gắn `Authorization: Bearer <access_token>`; server verify qua `supabase.auth.getUser(jwt)`. Không dùng cookie session ở tầng API.
- **/api/me chỉ cần anon key + JWT của caller** (RLS tự lọc) — **KHÔNG dùng service_role** cho endpoint này.

## Files (tạo/sửa — chỉ trong scope F03)
| File | Việc |
|---|---|
| `web/package.json` | thêm dep `@supabase/supabase-js` |
| `web/lib/supabaseClient.ts` | browser client singleton (localStorage, PKCE, detectSessionInUrl). Export `supabase`. |
| `web/lib/supabaseServer.ts` | `getUserFromRequest(req)`: đọc `Authorization: Bearer`, tạo client anon + set token, gọi `auth.getUser()`; trả `{ user }` hoặc `null`. |
| `web/lib/cors.ts` | `corsHeaders(origin)` phản chiếu origin hợp lệ (web `NEXT_PUBLIC_APP_URL` + `chrome-extension://*`), cho `Authorization, Content-Type`, methods `GET,POST,DELETE,OPTIONS`. **Không bao giờ `*`.** |
| `web/lib/apiClient.ts` | `apiFetch(path, init)`: lấy access_token từ `supabase.auth.getSession()`, gắn Bearer, gọi `NEXT_PUBLIC_APP_URL + path`. |
| `web/hooks/useUser.ts` | hook `{ user, loading }` — `getSession()` + `onAuthStateChange`. |
| `web/components/AuthGuard.tsx` | client component: chưa login → `router.replace('/')`; đang load → spinner/null; có user → render children. |
| `web/app/page.tsx` | nút **"Đăng nhập với Google"** → `supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: NEXT_PUBLIC_APP_URL + '/auth/callback' }})`. Nếu đã login → link/redirect `/dashboard`. |
| `web/app/auth/callback/page.tsx` | xử lý quay về OAuth: đợi `detectSessionInUrl` set session (hoặc `exchangeCodeForSession`), rồi `router.replace('/dashboard')`. Lỗi → về `/` kèm thông báo. |
| `web/app/api/me/route.ts` | `GET` + `OPTIONS` (preflight). Xem Specifications. |

> `/dashboard` chưa tồn tại (F05) — tạm redirect tới `/` hoặc render placeholder tối thiểu **chỉ để callback không 404**; KHÔNG dựng dashboard thật (ngoài scope).

## Specifications

### `GET /api/me`
- Đọc header `Authorization`. Thiếu / sai định dạng / token invalid → **HTTP 401** `{ "error": "unauthorized" }`.
- Hợp lệ: `supabase.auth.getUser(jwt)` ra user → truy vấn `profiles` (client scoped bằng chính JWT, RLS lọc) → trả **200** `{ id, email, nickname }`.
  - Nếu profile chưa kịp có (edge) → fallback `{ id: user.id, email: user.email, nickname: null }`, vẫn 200.
- **CORS:** cả `GET` và `OPTIONS` set header từ `corsHeaders(request origin)`. `OPTIONS` → 204. Origin không hợp lệ → không set ACAO (không phản chiếu).
- **Không throw/500 vì auth**: mọi lỗi auth → 401 JSON. Lỗi bất ngờ khác → 500 JSON `{ error }` gọn, không lộ stack.

### CORS (áp cho mọi API sau này)
- Phản chiếu `Origin` **chỉ khi** khớp `NEXT_PUBLIC_APP_URL` hoặc bắt đầu `chrome-extension://`. Ngược lại bỏ qua ACAO.
- `Access-Control-Allow-Headers: Authorization, Content-Type`; `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`.

## Acceptance Criteria (Gherkin — phải testable)
```gherkin
Scenario: Thiếu token bị chặn
  When GET /api/me không có header Authorization
  Then trả HTTP 401 và body {"error":"unauthorized"}

Scenario: Token sai bị chặn
  When GET /api/me với Authorization "Bearer invalid.token"
  Then trả HTTP 401

Scenario: Token hợp lệ trả hồ sơ
  Given một access_token hợp lệ của user đã đăng nhập
  When GET /api/me với Bearer token đó
  Then trả HTTP 200 và body có {id, email, nickname}

Scenario: CORS không dùng wildcard
  When OPTIONS /api/me với Origin "chrome-extension://abc"
  Then response có Access-Control-Allow-Origin == "chrome-extension://abc"
  And KHÔNG có Access-Control-Allow-Origin: "*"

Scenario: AuthGuard chặn khách chưa đăng nhập
  Given chưa có session
  When mở trang bọc bởi AuthGuard
  Then bị chuyển hướng về "/"

Scenario: Trang "/" có đăng nhập Google
  When mở "/" lúc chưa login
  Then thấy nút "Đăng nhập với Google" gọi signInWithOAuth(provider=google)

Scenario: Chất lượng
  When chạy ./init.sh web
  Then lint + typecheck + build đều xanh
```

## Constraints
- **Stay in scope:** chỉ F03. KHÔNG viết endpoint vocabulary/lookup/dashboard (F04), KHÔNG dựng trang tu-vung/flashcard/quiz/dashboard thật (F05), KHÔNG động vào extension (F06+).
- **Reuse:** theo mẫu `app/api/health/route.ts`; `corsHeaders` dùng lại cho mọi API sau.
- **Secrets:** `/api/me` KHÔNG dùng `SUPABASE_SERVICE_ROLE_KEY`. Không log token/JWT.
- **Không đổi** schema DB, không sửa migration.
- `@supabase/supabase-js` cài ở workspace `web` (không phải root).

## Cách verify (Builder tự chạy trước khi báo done)
1. `./init.sh web` → phải all green (dán output).
2. Test 401 tự động (không cần OAuth):
   ```bash
   npm run dev -w web   # hoặc build+start
   curl -i http://localhost:3000/api/me                          # kỳ vọng 401
   curl -i -H "Authorization: Bearer invalid.token" http://localhost:3000/api/me   # 401
   curl -i -X OPTIONS -H "Origin: chrome-extension://abc" http://localhost:3000/api/me  # ACAO == origin, không '*'
   ```
3. **Path token-hợp-lệ (200)** cần user thật → **để Homeowner verify** khi Google OAuth đã bật (redirect Supabase: `https://ealcahjaftwrllbudkyr.supabase.co/auth/v1/callback`). Ghi rõ "chờ Homeowner" trong report cho scenario này.

## VERIFY của Chủ thầu (sau khi Builder báo done)
Chạy `adversarial-verify` với `args.criteria` = 6 scenario trên + `securityChecks` = ["/api/me thiếu JWT trả 401","CORS không dùng *","/api/me không dùng service_role","không log JWT"]. ≥1 confirmedFailure → trả lại Builder.

## Report Format (Builder điền khi xong)
```
STATUS: DONE / PARTIAL / BLOCKED
FILES CHANGED: [tạo + sửa, kèm mục đích]
TEST RESULTS: [từng AC pass/fail + output curl 401/OPTIONS; scenario 200 = "chờ Homeowner OAuth"]
ISSUES DISCOVERED: [nếu có]
DEVIATIONS FROM SPEC: [gì + vì sao]
SUGGESTIONS FOR CHỦ THẦU: [nếu có]
```
```
```
