# TIP-F06 — Extension scaffold (MV3 + auth-bridge + popup + SM_API proxy)

> **Từ:** Chủ thầu (Contractor) · **Cho:** Thợ thi công (Builder) · **Ngày:** 2026-07-06

## Header
- **Feature ID:** F06 · **Dependencies:** F04 (API core — extension gọi vào) — DONE
- **Priority:** P0 (nền cho F07/F08) · **Effort:** M (~1 ngày)
- **Blueprint:** §2 (cây extension), §6 (luồng kỹ thuật: auth-bridge, SM_API), §8 (bảo mật) · **Security:** `.claude/workflow/security.md` (Info disclosure — secret-in-bundle P0)

## Context
- **Working dir:** `extension/`
- **Đã có (F01 stub — THAY bằng bản thật):** `manifest.json` (MV3 cơ bản), `build.mjs` (esbuild, inject **PUBLIC** env: `EXT_SUPABASE_URL`, `EXT_SUPABASE_ANON_KEY`, `EXT_APP_URL`), stub `src/background/service-worker.ts`, `src/content/youtube.ts` (GIỮ stub — F07/F08), `src/popup/popup.ts` + `popup.html`.
- **API sẵn (F04):** mọi `/api/*` nhận `Authorization: Bearer <jwt>`, CORS đã phản chiếu `chrome-extension://*`. `GET /api/me` để check user.
- **Web (F03):** session Supabase lưu **localStorage** key `sb-<ref>-auth-token` (ref = `ealcahjaftwrllbudkyr`, suy từ `EXT_SUPABASE_URL`). `persistSession:true` đã bật → auth-bridge đọc được.
- **Env build:** `extension/.env.example` có `EXT_SUPABASE_URL`, `EXT_SUPABASE_ANON_KEY`, `EXT_APP_URL`. Homeowner sẽ điền `.env` khi build.

## Task
Dựng khung extension MV3 thật: **auth-bridge** (đọc session web → chia sẻ cho extension), **service-worker** (SM_API proxy né CORS), **popup** (trạng thái login + mở web + đăng xuất), **lib** (chỉ anon key + URL). KHÔNG làm phụ đề/click-từ (F07/F08).

### Quyết định kiến trúc (đã chốt — KHÔNG đổi, xung đột → escalate):
- **Extension CHỈ chứa anon key + URL.** Tuyệt đối KHÔNG service_role/OPENAI key. `init.sh` grep dist = 0 secret là **P0 done-gate**.
- **Auth-bridge KHÔNG tự đăng nhập:** chỉ **đọc** `localStorage['sb-<ref>-auth-token']` trên origin web (khi user đã login web), forward session (access_token + refresh_token + user) sang background → `chrome.storage.local`. Popup + SM_API dùng token đã lưu.
- **Content script không gọi API trực tiếp** (CORS youtube): gửi `chrome.runtime.sendMessage({type:'SM_API', method, path, body})` → background `fetch(APP_URL+path, Bearer token)` → trả kết quả. (F07/F08 sẽ dùng; F06 dựng sẵn handler + test bằng `/api/me`.)
- **Token refresh tối giản MVP:** nếu SM_API nhận 401, thử refresh 1 lần qua Supabase token endpoint (anon key) bằng refresh_token đã lưu; fail → coi như logged out. (Không dựng full supabase-js trong SW nếu nặng — gọi REST `POST /auth/v1/token?grant_type=refresh_token`.)
- **Bắt "Extension context invalidated":** auth-bridge poll localStorage phải try/catch, khi context chết (`chrome.runtime?.id` undefined) → **dừng poll**, không throw loop (bài học app gốc).

## Files (tạo/sửa — chỉ scope F06)
| File | Việc |
|---|---|
| `extension/manifest.json` | MV3 hoàn chỉnh: `permissions:["storage"]`; `host_permissions` = APP_URL + youtube; `background.service_worker`; `content_scripts`: (1) auth-bridge match APP_URL origin, (2) youtube.js match youtube (giữ stub); `action.default_popup`. KHÔNG xin quyền thừa. |
| `extension/src/lib/env.ts` | export `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_URL` từ `process.env.EXT_*` (build inject). `SUPABASE_REF` suy từ URL. **Chỉ giá trị public.** |
| `extension/src/lib/supabaseExt.ts` | `STORAGE_KEY = 'sb-'+ref+'-auth-token'`; helper đọc/parse session shape; `refreshSession(refresh_token)` gọi REST anon. |
| `extension/src/lib/apiExt.ts` | `smApi(method, path, body)` dùng trong content/popup: gửi message SM_API, trả JSON. |
| `extension/src/background/service-worker.ts` | THAY stub: listener `SM_API` (đọc token chrome.storage → fetch APP_URL → 401 thì refresh 1 lần → trả); listener `SM_SESSION` (nhận session từ auth-bridge → lưu chrome.storage.local); `SM_LOGOUT` (xoá). |
| `extension/src/content/auth-bridge.ts` | MỚI. Chạy trên origin web: đọc `localStorage[STORAGE_KEY]`, gửi `SM_SESSION` khi có/đổi; poll nhẹ (vài giây) có guard context-invalidated. |
| `extension/src/popup/popup.ts` + `popup.html` | THAY stub: hiển thị email/avatar nếu đã login (đọc chrome.storage hoặc SM_API `/api/me`); nút "Mở web để đăng nhập" (`APP_URL`); nút "Đăng xuất" (`SM_LOGOUT`). |
| `extension/build.mjs` | thêm entry `auth-bridge` nếu cần (đảm bảo build ra `auth-bridge.js`). Giữ inject PUBLIC env. |

> GIỮ NGUYÊN `src/content/youtube.ts` stub (F07/F08). KHÔNG làm overlay/subtitle/click.

## Specifications
- **manifest:** `manifest_version:3`. `content_scripts[0]`: `matches:["http://localhost:3000/*", "<APP_URL prod nếu có>"]`, `js:["auth-bridge.js"]`, `run_at:"document_idle"`. `content_scripts[1]`: youtube (giữ). `host_permissions`: `["http://localhost:3000/*","https://www.youtube.com/*"]` (+ supabase URL nếu refresh REST cần — hoặc gọi trong SW không cần host_permission). Không dùng `<all_urls>`.
- **auth-bridge:** parse `localStorage[STORAGE_KEY]` (JSON, có `access_token`, `refresh_token`, `user`). Gửi `SM_SESSION` khi lần đầu thấy + khi token đổi. Không có session → gửi `SM_LOGOUT` hoặc bỏ qua. Guard: `if (!chrome.runtime?.id) return;` để dừng khi context chết.
- **service-worker SM_API:** `{type:'SM_API', method, path, body}` → lấy `access_token` từ storage; `fetch(APP_URL+path, {method, headers:{Authorization:Bearer, Content-Type}, body})`. 401 → `refreshSession` (refresh_token) → lưu token mới → retry 1 lần. Trả `{ok, status, data}` hoặc `{ok:false, status:401}`.
- **popup:** load trạng thái: nếu có session → gọi SM_API `GET /api/me` → hiện email; lỗi/không login → hiện nút "Mở web để đăng nhập" (mở tab `APP_URL`). "Đăng xuất" → `SM_LOGOUT` + refresh UI.

## Acceptance Criteria (Gherkin — testable)
```gherkin
Scenario: Build sạch
  When node build.mjs (dev) và node build.mjs --prod
  Then tạo extension/dist/ với manifest.json, service-worker.js, auth-bridge.js, youtube.js, popup.js, popup.html

Scenario: SECRET — dist 0 secret (P0)
  When ./init.sh extension (hoặc ./init.sh secret)
  Then grep dist KHÔNG thấy service_role / OPENAI / private key → 0 secret
  And dist chỉ chứa anon key + URL (public)

Scenario: manifest hợp lệ MV3
  When load unpacked extension/dist vào Chrome
  Then không lỗi manifest; quyền = storage + host_permissions cụ thể (không <all_urls>)

Scenario: SM_API proxy
  Given có session lưu (mock chrome.storage với access_token hợp lệ)
  When background nhận {type:'SM_API', method:'GET', path:'/api/me'}
  Then fetch APP_URL/api/me với Bearer, trả {ok:true, data:{id,email}}
  When token thiếu/sai
  Then trả {ok:false, status:401} (không throw)

Scenario: auth-bridge context-invalidated
  Given content script mất context (chrome.runtime.id undefined)
  When vòng poll chạy
  Then dừng, KHÔNG throw loop

Scenario: Chất lượng
  When npm run typecheck -w extension
  Then typecheck xanh
```

## Constraints
- **Stay in scope:** chỉ auth-bridge + SW + popup + lib + manifest. KHÔNG subtitle/overlay/click-từ (F07/F08). KHÔNG sửa web/API.
- **Secret P0:** chỉ `EXT_SUPABASE_ANON_KEY` + URL. Không import/hardcode service_role/OPENAI. `init.sh` grep phải sạch — feature KHÔNG done nếu grep dơ.
- **MV3:** service_worker (không persistent background); không `eval`/remote script; CSP mặc định MV3.
- **Không thêm dep nặng** — refresh session bằng `fetch` REST (không cần full supabase-js trong SW; nếu dùng supabase-js cho tiện thì chấp nhận nhưng phải tree-shake, vẫn 0 secret).
- Bắt "Extension context invalidated" (dừng poll).

## Cách verify (Builder tự chạy)
1. `node build.mjs` + `node build.mjs --prod` → dist đủ file (dán ls).
2. **`./init.sh extension`** → build + **grep secret = 0** (P0, dán output).
3. `npm run typecheck -w extension` xanh.
4. **SM_API logic:** test hàm proxy bằng cách mock (node hoặc unit) với token hợp lệ (mint qua service_role như F04) → `/api/me` trả 200; token sai → {ok:false,401}.
5. Load unpacked vào Chrome + mô tả (popup hiện nút login; sau khi login web thì popup hiện email) — phần bấm thật cần Homeowner có OAuth; đánh dấu "chờ Homeowner".

## VERIFY của Chủ thầu (sau khi báo done)
`adversarial-verify` criteria = các Scenario + securityChecks = ["dist 0 service_role/OPENAI (init.sh secret)", "chỉ anon key + URL trong bundle", "manifest không <all_urls>, quyền tối thiểu", "auth-bridge guard context-invalidated không loop", "SM_API 401 không throw"]. **Bắt buộc chạy `./init.sh secret` — 0 secret mới cho done.**

## Report Format (Builder điền)
```
STATUS: DONE / PARTIAL / BLOCKED
FILES CHANGED:
TEST RESULTS:  (kèm ls dist + output init.sh secret; đánh dấu "chờ Homeowner" cho load-Chrome thật)
ISSUES DISCOVERED:
DEVIATIONS FROM SPEC:
SUGGESTIONS FOR CHỦ THẦU:
```
