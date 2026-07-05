# Deutsch Lernen — MVP Design Spec

> Ngày: 2026-07-05
> Trạng thái: Đã duyệt (Homeowner duyệt hết 2026-07-05)
> Repo: https://github.com/dokhiem2k4/Deutsch-Lernen-Youtube — local `D:\dev\Deutsch-Lernen-Youtube`

Người **Việt** học **tiếng Đức** qua YouTube: phụ đề song ngữ Đức–Việt + click từ tra nghĩa (AI) để lưu, rồi ôn lại trên web bằng flashcard/quiz. Phỏng theo StudyMovie (bản tiếng Anh) nhưng **gộp FE + BE** vào một app Next.js full-stack và **bỏ mọi phần không thuộc lõi học tập** (paywall, leaderboard, admin, v.v.).

---

## 0. Quyết định đã chốt (không đảo nếu không re-confirm)

- **D-1 — Đối tượng:** người Việt học tiếng Đức. Phụ đề gốc = **tiếng Đức**; bản dịch = **tiếng Việt** qua YouTube auto-translate (`timedtext` + `tlang=vi`). Không dịch trả phí.
- **D-2 — Nghĩa từ = AI, không từ điển nhúng.** Không có từ điển Đức–Việt embed sẵn → dùng **OpenAI GPT-4o-mini** đọc *từ được click + cả câu* → trả nghĩa tiếng Việt theo ngữ cảnh, kèm **lemma** (nguyên thể) và **article** (der/die/das). AI đảm nhiệm luôn lemmatize + xác định giống từ (phức tạp nếu làm bằng rule ở tiếng Đức). Có **cache** để tiết kiệm token. Secret `OPENAI_API_KEY` chỉ ở server.
- **D-3 — Audio = `speechSynthesis` giọng `de-DE`** của trình duyệt (không phụ thuộc API ngoài, chạy offline). IPA: bỏ ở MVP (tiếng Đức phát âm khá theo chính tả).
- **D-4 — Kiến trúc gộp:** một app **Next.js 15 (App Router)**; API = **Route Handlers** trong `app/api/`. KHÔNG có backend Hono riêng. Extension gọi thẳng các Route Handler này.
- **D-5 — Auth + DB = Supabase** (Postgres + Auth **Google OAuth** + RLS + RPC). Extension và web **chung 1 tài khoản** qua shared session (auth-bridge đọc `localStorage` của web).
- **D-6 — Streak theo hoạt động học từ**, KHÔNG theo thời gian (không có timer). Ngày "có học" = ngày user lưu từ mới hoặc đánh dấu đã học (`learned_at`). Compute-on-read, không cron.
- **D-7 — Không paywall.** MVP cho dùng tự do, không trial/subscription/thanh toán.

## 1. Phạm vi (scope)

### IN (MVP)
- **Auth:** đăng nhập Google (Supabase), đăng xuất, protected routes.
- **Extension (Chrome MV3):**
  - Phụ đề song ngữ Đức (trên) + Việt (dưới) trên YouTube, đồng bộ `currentTime`.
  - Click 1 từ tiếng Đức → pause video → popup: từ (lemma + article) + nghĩa Việt (AI) + nút **Lưu** (lưu kèm câu ngữ cảnh) + nút phát âm (`speechSynthesis`).
  - Cài đặt phụ đề trong popup: bật/tắt dòng Đức, bật/tắt dòng Việt, cỡ chữ (±), độ đậm nền đen (%). Áp realtime, lưu `chrome.storage`.
  - Popup: trạng thái đăng nhập (avatar/email) + nút mở web để đăng nhập + đăng xuất.
- **Web (Next.js):**
  - `/` login Google; `/auth/callback` xử lý OAuth.
  - `/tu-vung` danh sách từ đã lưu (word, article, nghĩa, câu ví dụ, trạng thái Từ mới/Đã học); xóa từng từ; nút vào Flashcard/Quiz.
  - `/hoc-tu-vung` Flashcard: lật thẻ (mặt trước từ Đức + article + loa, mặt sau nghĩa Việt + ví dụ); qua lại hết bộ; dùng toàn bộ từ. Xem thẻ → đánh dấu `learned_at`.
  - `/kiem-tra-duc-viet` + `/kiem-tra-viet-duc` Quiz trắc nghiệm 2 chiều: 4 đáp án (1 đúng + 3 sai random từ vocab của chính user), chấm điểm; <4 từ → chặn có thông báo.
  - `/dashboard` streak (ngày liên tiếp có hoạt động), tổng số từ đã học, biểu đồ từ vựng theo ngày (30 ngày).

### OUT (không làm ở MVP — có thể thêm sau)
Timer học, leaderboard, playlist, kế hoạch tuần, level system, admin panel, thanh toán/VietQR/SePay, trial/subscription/paywall, từ điển nhúng, IPA, file audio, đăng nhập email/mật khẩu, Netflix, app mobile.

## 2. Kiến trúc & cây thư mục

```
Deutsch-Lernen-Youtube/
├── web/                              # Next.js 15 full-stack (FE + API)
│   ├── app/
│   │   ├── page.tsx                  # / login Google
│   │   ├── auth/callback/page.tsx    # OAuth callback
│   │   ├── dashboard/page.tsx
│   │   ├── tu-vung/page.tsx
│   │   ├── hoc-tu-vung/page.tsx
│   │   ├── kiem-tra-duc-viet/page.tsx
│   │   ├── kiem-tra-viet-duc/page.tsx
│   │   ├── layout.tsx, globals.css
│   │   └── api/                      # = "backend" (Route Handlers)
│   │       ├── me/route.ts           # GET profile
│   │       ├── lookup-context/route.ts   # POST nghĩa AI (Đức→Việt)
│   │       ├── vocabulary/route.ts       # GET/POST/DELETE
│   │       ├── vocabulary/mark-learned/route.ts  # POST
│   │       └── dashboard/route.ts        # GET streak + số từ + biểu đồ
│   ├── components/                   # AuthGuard, Header, QuizGame, ui/*
│   ├── lib/                          # supabaseClient, supabaseServer, apiClient, vocabulary, dashboard, auth helper
│   ├── hooks/useUser.ts
│   ├── middleware.ts (nếu cần CORS cho extension) hoặc cấu hình trong route
│   ├── package.json, tsconfig, next.config.ts, .env.example
├── extension/                        # Chrome MV3, esbuild
│   ├── manifest.json
│   ├── build.mjs
│   └── src/
│       ├── background/service-worker.ts   # lưu session, proxy API (né CORS youtube), 
│       ├── content/yt-intercept.ts        # MAIN world: bắt URL timedtext đã ký, lấy DE + VI(tlang=vi)
│       ├── content/youtube.ts             # ISOLATED: overlay 2 dòng + click-từ + settings
│       ├── content/auth-bridge.ts         # đọc session localStorage web → background
│       ├── popup/popup.ts + popup.html
│       └── lib/ captions.ts, settings.ts, apiExt.ts, supabaseExt.ts, env.ts
├── supabase/
│   └── migrations/                   # 001 init schema+RLS+trigger, 002 rpc get_dashboard
├── docs/superpowers/specs/           # spec này
├── .env.example
├── README.md
└── package.json                      # npm workspaces: web, extension
```

**Điểm khác StudyMovie:** không có `web/backend` (Hono). Mọi endpoint là Next.js Route Handler dùng `@supabase/supabase-js` với JWT của caller (RLS theo `auth.uid()`); các thao tác cần quyền cao (không có ở MVP) mới cần service_role.

**Gọi API từ extension:** content script không gọi trực tiếp (CORS của youtube.com) → gửi message `SM_API` sang **background service worker**, background gọi `fetch(<APP_URL>/api/...)` kèm `Authorization: Bearer <jwt>` rồi trả kết quả về. Đây là pattern giữ nguyên từ app gốc.

## 3. Data model (Supabase)

### Bảng
| Bảng | Cột | Ghi chú |
|---|---|---|
| `profiles` | `id uuid pk` (=auth.users.id), `email text`, `nickname text`, `created_at timestamptz default now()` | Tạo tự động qua trigger `handle_new_user` khi có auth user mới. |
| `vocabulary` | `id uuid pk`, `user_id uuid fk auth.users`, `word text`, `lemma text`, `article text` (der/die/das/null), `meaning_vi text`, `example text`, `learned_at timestamptz null`, `created_at timestamptz default now()` | `UNIQUE(user_id, word)` (idempotent lưu). `learned_at` null = Từ mới. |
| `ai_meaning_cache` | `id uuid pk`, `word text`, `context_hash text`, `lemma text`, `article text`, `meaning_vi text`, `created_at` | Cache theo `(word, context_hash)` để không gọi lại AI cho cùng từ+ngữ cảnh. Không gắn user. |

### RLS
- `profiles`: user chỉ SELECT/UPDATE dòng `id = auth.uid()`.
- `vocabulary`: user chỉ SELECT/INSERT/UPDATE/DELETE dòng `user_id = auth.uid()`.
- `ai_meaning_cache`: không expose trực tiếp cho client; đọc/ghi qua Route Handler bằng service_role (cache dùng chung mọi user). RLS bật, không policy cho `authenticated`.
- Trigger `handle_new_user()` (SECURITY DEFINER): insert `profiles` khi tạo auth user.

### RPC
- `get_dashboard()` (SECURITY DEFINER, dùng `auth.uid()`): trả
  - `total_learned` = count(`vocabulary` where `learned_at is not null`),
  - `total_words` = count(`vocabulary`),
  - `streak` = số ngày liên tiếp (tính đến hôm nay, giờ VN UTC+7) có ít nhất 1 hoạt động — hoạt động = có `vocabulary.created_at` HOẶC `vocabulary.learned_at` rơi vào ngày đó,
  - `today_active` bool,
  - `chart` = mảng {date, count} 30 ngày gần nhất (số từ có `learned_at` theo ngày, giờ VN).

Toàn bộ compute-on-read, không cron, không xóa dữ liệu.

## 4. API (Route Handlers)

Mọi route (đều dưới `/api`) yêu cầu `Authorization: Bearer <supabase jwt>`, verify qua `supabase.auth.getUser(jwt)`; thiếu/sai → **401**. Dùng client tạo theo JWT của caller để RLS tự lọc.

| Method + path | Body/Query | Trả về | Ghi chú |
|---|---|---|---|
| `GET /api/me` | — | `{ id, email, nickname }` | Profile của caller. |
| `POST /api/lookup-context` | `{ word, sentence }` | `{ lemma, article, meaning_vi, word_type, source }` | Kiểm cache trước; miss → gọi OpenAI gpt-4o-mini (server) → ghi cache. Lỗi/thiếu key → `{ error }` + `meaning_vi` rỗng, không 500 làm vỡ UI. |
| `GET /api/vocabulary` | — | `[{ id, word, lemma, article, meaning_vi, example, learned_at, created_at }]` | Của caller, mới nhất trước. |
| `POST /api/vocabulary` | `{ word, lemma, article, meaning_vi, example }` | `{ id, ... }` | Idempotent theo UNIQUE(user_id, word); trùng → trả dòng cũ, không lỗi. |
| `DELETE /api/vocabulary?id=` | query `id` | `{ ok: true }` | Chỉ xóa của caller (RLS). |
| `POST /api/vocabulary/mark-learned` | `{ ids: string[] }` | `{ ok: true }` | set `learned_at=now()` cho các id thuộc caller mà `learned_at is null` (idempotent); ids rỗng → no-op. |
| `GET /api/dashboard` | — | `{ total_learned, total_words, streak, today_active, chart }` | Gọi RPC `get_dashboard`. |
| `GET /api/health` | — | `{ status: "ok" }` | Public, không auth. |

**CORS:** cho phép origin của web + `chrome-extension://*` (KHÔNG dùng `*`), cho phép header `Authorization`. Cấu hình trong từng Route Handler hoặc `middleware.ts`.

## 5. Nghĩa từ AI (chi tiết `/api/lookup-context`)

- **Input:** `word` (chuỗi đã click), `sentence` (câu tiếng Đức chứa từ).
- **Cache key:** `context_hash = hash(sentence)` + `word` (lowercased). Hit → trả ngay.
- **Prompt (system):** yêu cầu model trả **JSON đúng schema** `{ lemma, article, meaning_vi, word_type }`:
  - `lemma`: nguyên thể tiếng Đức (danh từ số ít + hoa; động từ nguyên thể; ...).
  - `article`: `der`/`die`/`das` nếu là danh từ, ngược lại `null`.
  - `meaning_vi`: **một** nghĩa tiếng Việt hợp ngữ cảnh câu (ngắn gọn).
  - `word_type`: noun/verb/adj/... (để hiển thị nhãn nhỏ, optional).
- **Model:** `gpt-4o-mini`, `response_format: json_object`, temperature thấp.
- **Fallback:** thiếu `OPENAI_API_KEY` / lỗi mạng / JSON hỏng → trả `meaning_vi` rỗng + `source:"error"`; popup hiện "Không tra được nghĩa, thử lại" — KHÔNG vỡ.
- **Bảo mật:** key chỉ đọc từ `process.env` trong Route Handler; grep bundle extension phải sạch key.

## 6. Extension — luồng kỹ thuật

- **Phụ đề:** `yt-intercept.ts` (MAIN world, `document_start`) hook `fetch`/XHR bắt URL `timedtext` **đã ký** mà player tự gọi (tránh anti-bot). Lấy **DE** từ track gốc (fmt=json3); lấy **VI** bằng cùng `baseUrl` + `&tlang=vi` (auto-translate). Xử lý trang Google "Sorry/automated queries" → retry 1 lần + phân biệt trạng thái VI (ok/blocked/empty). postMessage cues sang `youtube.ts`.
- **Overlay:** `youtube.ts` (ISOLATED) chèn 2 dòng trong `#movie_player`, chọn cue theo max-start (cue mới nhất `start ≤ t < start+dur`), ẩn khi khoảng trống. Ẩn caption gốc YouTube bằng style.
- **Click-từ:** click 1 từ Đức → `video.pause()` → gửi `SM_API` (POST `/api/lookup-context` với `word` + `sentence` = câu Đức của cue đang hiện) qua background → popup nghĩa + Lưu (POST `/api/vocabulary`, `example` = câu ngữ cảnh) + loa (`speechSynthesis` `de-DE`). Click ra ngoài/Đóng → `video.play()`.
- **Settings:** `settings.ts` model `{ showDe, showVi, bgEnabled, bgOpacity(0..100), fontSizePx(12..32) }` lưu `chrome.storage.local`; popup điều khiển; `youtube.ts` áp realtime.
- **Auth-bridge:** chạy trên origin web, đọc `localStorage` key `sb-<ref>-auth-token` → gửi session sang background (setSession vào `chrome.storage`, CHỈ anon key). Popup hiển thị user + nút mở web/đăng xuất. Bắt lỗi "Extension context invalidated" (stop poll khi context chết) — bài học từ app gốc.

## 7. Web — UI

- Design tối giản, Tailwind v4, font Inter. Không cần khớp Figma (app gốc mới cần). Component tái sử dụng: `Header` (nav: Tiến độ học / Từ vựng), `AuthGuard` (chưa login → về `/`), `QuizGame` (dùng chung 2 route quiz với prop `direction`), `ui/` (Button, Card, Badge, Spinner).
- Trang học từ: **article hiển thị nổi bật** (der/die/das tô màu theo giống — nhấn mạnh đặc thù tiếng Đức) là điểm nhấn UX so với bản tiếng Anh.

## 8. Lỗi & bảo mật (tổng hợp)

- Video không caption Đức → overlay im lặng, không throw.
- YouTube anti-bot VI → retry + nhãn trạng thái.
- Mọi `/api` (trừ `/api/health`) chặn 401 khi thiếu JWT; RLS chặn chéo user ở tầng DB.
- Secret (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) chỉ ở server (Route Handler). Extension chỉ chứa anon key + URL. Grep dist extension phải 0 secret.
- CORS phản chiếu origin web + `chrome-extension://`, không `*`.

## 9. Kiểm thử & Definition of Done

- **Web/API:** `npm run lint` + `typecheck` + `build` sạch; test auth-contract (401 thiếu token cho mỗi route bảo vệ) + logic lookup cache/vocabulary idempotent (Vitest). 
- **Extension:** `lint` + `build` (dev + prod) sạch; grep dist **không** lộ service_role/OpenAI key.
- **Verify thủ công (Homeowner):** 1 video YouTube tiếng Đức thật → phụ đề Đức+Việt hiện đồng bộ → click 1 từ → nghĩa AI đúng ngữ cảnh + Lưu → mở web `/tu-vung` thấy từ → Flashcard/Quiz chạy → `/dashboard` streak + biểu đồ cập nhật.
- Một tính năng chỉ `done` khi lint+typecheck+test pass; `verified` khi Homeowner chạy qua flow thật.

## 10. Setup cần Homeowner (ngoài scope code)

1. Tạo **Supabase project** mới (region tùy, đề xuất Singapore), lấy URL + anon key + service_role key.
2. Bật **Google OAuth** trong Supabase (tạo OAuth client ở Google Cloud, thêm redirect URL Supabase).
3. Lấy **OpenAI API key** (cho nghĩa AI).
4. Điền `.env` (web) + `.env`/build config (extension) theo `.env.example`.
5. Áp 2 migration lên Supabase.

## 11. Thứ tự triển khai (sẽ chi tiết ở kế hoạch)

Web trước, Extension sau (giống app gốc):
1. Scaffold monorepo (web Next.js + extension + supabase) + `.env.example` + README.
2. Supabase migrations (schema + RLS + trigger + RPC).
3. Web auth (login Google + AuthGuard + `/api/me`).
4. API vocabulary + lookup-context (AI) + dashboard RPC endpoint.
5. Web trang: tu-vung, hoc-tu-vung (flashcard), quiz 2 chiều, dashboard.
6. Extension: scaffold MV3 + auth-bridge + popup.
7. Extension: phụ đề Đức+Việt (intercept + overlay).
8. Extension: click-từ → lookup AI → lưu + settings phụ đề.
9. Verify tổng + README/handover.
