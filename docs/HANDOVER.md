# Deutsch Lernen — Handover (F09)

> Bàn giao MVP. Ngày: 2026-07-06. Design đã duyệt: [`docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`](superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md).
> Setup & chạy: [`../README.md`](../README.md). Trạng thái feature: [`../feature_list.json`](../feature_list.json), nhật ký + bằng chứng: [`../progress.md`](../progress.md).

Người **Việt** học **tiếng Đức** qua YouTube: phụ đề song ngữ Đức–Việt + click từ tra nghĩa (AI) để lưu, ôn lại trên web bằng flashcard/quiz.

---

## 1. Kiến trúc tóm tắt (Explanation)

Monorepo npm workspaces: **web** (Next.js 15 full-stack) + **extension** (Chrome MV3). DB/Auth = **Supabase**.

```
┌────────────── Chrome Extension (MV3) ──────────────┐        ┌─────────── Web (Next.js 15) ───────────┐
│ yt-intercept.ts (MAIN)  bắt timedtext đã ký        │        │ / login Google, /auth/callback         │
│   → refetch DE(json3)+VI(tlang=vi) → postMessage   │        │ /tu-vung /hoc-tu-vung /kiem-tra-* /dashboard│
│ youtube.ts (ISOLATED)   overlay 2 dòng + click-từ  │        │ app/api/* = Route Handlers (Bearer JWT) │
│ auth-bridge.ts  đọc session localStorage web ──────┼──────► │   me, lookup-context, vocabulary,       │
│ service-worker  SM_API proxy (Bearer + refresh)  ──┼──http─►│   vocabulary/mark-learned, dashboard    │
│ popup  login + Cài đặt phụ đề (chrome.storage)     │        │   (health = public)                     │
└────────────────────────────────────────────────────┘        └──────────────┬─────────────────────────┘
                                                                              │ @supabase/supabase-js
                                                          ┌───────────────────▼───────────────────┐
                                                          │ Supabase: Auth(Google OAuth) +          │
                                                          │ Postgres 3 bảng (RLS auth.uid()) +      │
                                                          │ RPC get_dashboard + OpenAI gpt-4o-mini  │
                                                          │ (server-only, cache ai_meaning_cache)   │
                                                          └─────────────────────────────────────────┘
```

**Chốt kiến trúc (Blueprint §0):** một app Next.js (FE + API), extension gọi API qua background (né CORS youtube). Nghĩa từ = OpenAI gpt-4o-mini (không từ điển nhúng) + cache. Audio = `speechSynthesis` de-DE. Auth Google, web+extension chung 1 session qua auth-bridge đọc `localStorage`. Streak compute-on-read (không cron).

**Bảo mật (invariant):** `SUPABASE_SERVICE_ROLE_KEY` + `OPENAI_API_KEY` **chỉ ở server** (Route Handler / lib server). Extension chỉ chứa anon key + URL (`init.sh secret` = 0 secret trong `dist`). RLS mọi bảng user-data theo `auth.uid()`. CORS phản chiếu origin web + `chrome-extension://` (không `*`). AI input untrusted → ép JSON schema, không execute; lookup-context không bao giờ 500.

---

## 2. Bảng truy vết REQ (Blueprint §1 → Feature → Bằng chứng → Verified)

Trạng thái: **server** = verified bằng test tự động server-side (test user service_role / unit test / curl); **Homeowner** = Homeowner chạy live (OAuth + OpenAI); **chờ-Homeowner(UI)** = logic + data-path đã verify, còn hiển thị trên Chrome cần Homeowner mắt thường.

| REQ | Blueprint §1 (IN) | Feature | Bằng chứng (progress.md) | Verified |
|-----|-------------------|---------|--------------------------|----------|
| R1 | Auth: login Google, logout, protected routes | F03 | `/api/me` 401 khi thiếu JWT; OAuth authorize **302**; AuthGuard redirect | server + **Homeowner** |
| R2 | Phụ đề song ngữ DE(trên)+VI(dưới) sync currentTime | F07 | `captions.ts` **20/20** unit (parseJson3/pickCue/isAntiBot/buildUrl); intercept MAIN không chặn gốc | server(logic); overlay Chrome **chờ-Homeowner(UI)** |
| R3 | Click từ DE → pause → lemma+article+nghĩa AI + Lưu(câu) + phát âm | F08 + F04 | `words.ts` 17 unit; SM_API lookup 200 + save payload đầy đủ; **Katze→die/con mèo** `source:openai→cache` (Homeowner) | server + **Homeowner(AI)**; thẻ Chrome **chờ-Homeowner(UI)** |
| R4 | Cài đặt phụ đề (toggle DE/VI, cỡ chữ, độ đậm nền) realtime + chrome.storage | F08 | `settings.ts` clamp/persist unit; `onSettingsChanged` realtime | server(logic); realtime Chrome **chờ-Homeowner(UI)** |
| R5 | Popup: trạng thái login + mở web + đăng xuất | F06 | popup đọc session `chrome.storage.local`; `SM_LOGOUT`; auth-bridge forward | server(logic); popup Chrome **chờ-Homeowner(UI)** |
| R6 | `/` login Google + `/auth/callback` | F03 | nút Google; callback `exchangeCodeForSession`; OAuth 302 | server + **Homeowner** |
| R7 | `/tu-vung` list (word/article/nghĩa/câu/trạng thái) + xóa + nav | F05 | GET list 200; DELETE của mình; data-contract test | server; UI **chờ-Homeowner(UI)** |
| R8 | `/hoc-tu-vung` Flashcard lật + đánh dấu learned | F05 | flip → `learned_at` set (test user); serve 200 | server; UI **chờ-Homeowner(UI)** |
| R9 | Quiz 2 chiều, 4 đáp án (1 đúng + 3 distractor vocab), <4 chặn | F05 | `buildQuiz` 4-opt unique + chứa đáp án; block<4 / run≥4; dedup từ đồng nghĩa (fix VERIFY) | server; UI **chờ-Homeowner(UI)** |
| R10 | `/dashboard` streak + tổng từ + biểu đồ 30 ngày | F05 + F04 + F02 | dashboard 5 khóa + `chart[30]`; RPC `get_dashboard` | server; UI **chờ-Homeowner(UI)** |
| R11 | Nghĩa AI gpt-4o-mini + cache + secret server (D-2) | F04 | lookup fallback **không 500**; cache hit không gọi lại AI; **Katze openai→cache** (Homeowner); prompt-injection ép JSON; 0 secret | server + **Homeowner** |
| R12 | Supabase Auth + RLS + shared session (D-5) | F02, F03, F06 | RLS bật 3 bảng (scoped-JWT); auth-bridge chung session web↔extension | server |
| R13 | Streak compute-on-read, không cron (D-6) | F02 | RPC `get_dashboard` (streak/today_active/chart), không cron | server |
| R14 | Data model 3 bảng + RLS + RPC | F02 | 3 migration applied; advisors security **2 mục intentional** (rls_no_policy trên cache; authenticated execute RPC) | server |
| R15 | Audio `speechSynthesis` de-DE (D-3) | F08 | `speakDe` lang de-DE + guard | server(logic); phát âm Chrome **chờ-Homeowner(UI)** |

**0 mục IN §1 để trống.** OUT §1 (timer, leaderboard, paywall, IPA, từ điển nhúng, mobile…) — không làm, đúng scope.

---

## 3. Verified vs còn lại

- **Verified server-side (test tự động, dán ở `progress.md`):** toàn bộ API (401/RLS/idempotent/fallback/CORS), logic pure extension (captions/words/settings — 37 unit test tổng), SM_API contract, dashboard shape, SHIP gate `./init.sh all` + 0 secret.
- **Verified bởi Homeowner (live):** Google OAuth (`authorize` 302), OpenAI lookup thật (`Katze → die / con mèo`, `source:openai` rồi `cache`), extension build env thật 0 secret.
- **Còn chờ Homeowner (UI trên Chrome — không tự động hoá được):**
  1. Overlay 2 dòng Đức+Việt sync trên video Đức thật (F07); no-caption → im lặng; VI anti-bot → chỉ DE + nhãn.
  2. Click từ → pause → thẻ nghĩa → **Lưu** → web `/tu-vung` thấy → loa → đóng → play (F08).
  3. Toggle/slider settings trong popup → overlay đổi realtime + persist sau reload (F08).
  4. Web pages hiển thị sau login thật: `/tu-vung`, `/hoc-tu-vung`, `/kiem-tra-*`, `/dashboard` (F05).

Cách kiểm ở [`../README.md`](../README.md) §Verify + §Troubleshooting.

---

## 4. Known limitations / quyết định

- **Deploy hoãn:** chạy local (`npm run dev` :3000). Chưa setup Vercel. Extension = build artifact (`extension/dist`), không deploy server. Khi deploy: đặt `EXT_APP_URL` = domain thật rồi rebuild để manifest `host_permissions`/`content_scripts` khớp (build.mjs thay `__APP_ORIGIN__`).
- **IPA / file audio:** bỏ ở MVP (D-3) — dùng `speechSynthesis` de-DE.
- **Từ điển nhúng:** không có — nghĩa hoàn toàn từ AI (D-2); phụ thuộc OpenAI + quota.
- **VI = YouTube auto-translate** (`tlang=vi`) — chất lượng dịch máy; có thể dính anti-bot Google (đã xử lý: retry 1 lần → `blocked`, chỉ hiện DE).
- **Supabase advisors:** 2 mục security *intentional* — `rls_enabled_no_policy` trên `ai_meaning_cache` (chỉ service_role đọc/ghi, đúng chủ đích) + `authenticated execute` RPC `get_dashboard` (thiết kế RPC SECURITY DEFINER). 0 P0.
- **PAT/secret:** Supabase PAT từng lộ trong chat → nên rotate. MCP token không nạp phiên F09 (advisors tham chiếu kết quả F02).

## 5. Next steps

1. **Homeowner:** chạy 4 mục UI §3 trên Chrome (§9 Blueprint DoD full flow) → chuyển "chờ-Homeowner(UI)" thành verified.
2. Rotate Supabase PAT (đã lộ). Điền lại nếu cần dùng MCP.
3. (Sau MVP) Deploy web (Vercel) + set `EXT_APP_URL` prod + publish extension. Cân nhắc OUT-features nếu có nhu cầu.
