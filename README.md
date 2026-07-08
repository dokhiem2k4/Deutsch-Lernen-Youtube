# Deutsch Lernen — YouTube DE→VI

Người **Việt** học **tiếng Đức** qua YouTube: phụ đề song ngữ Đức–Việt + click từ tra nghĩa (AI) để lưu, rồi ôn lại trên web bằng flashcard/quiz. Monorepo npm workspaces: **web** (Next.js 15 full-stack) + **extension** (Chrome MV3).

> Bàn giao & kiến trúc + truy vết REQ: [`docs/HANDOVER.md`](docs/HANDOVER.md) · Design đã duyệt: [`docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`](docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md) · Trạng thái: [`feature_list.json`](feature_list.json) + [`progress.md`](progress.md).

## Cây thư mục
```
web/          Next.js 15 (App Router) — FE + API (app/api/* Route Handlers)
  app/        pages (/, /tu-vung, /hoc-tu-vung, /kiem-tra-*, /dashboard) + api/*
  components/ AuthGuard, Header, QuizGame, ui/*      lib/ supabase*, cors, apiClient, article, openai
extension/    Chrome MV3 (esbuild) — phụ đề + click-từ + settings
  src/background/service-worker.ts   SM_API proxy (Bearer + refresh)
  src/content/{yt-intercept(MAIN), youtube(ISOLATED), auth-bridge}.ts
  src/popup/*   src/lib/{captions,words,settings,speak,apiExt,supabaseExt,env}.ts
supabase/migrations/   3 .sql (schema+RLS+trigger, RPC get_dashboard, harden grants)
docs/         HANDOVER.md + spec
init.sh       verification runner (scaffold|web|extension|secret|all)
```

## Prerequisites
- **Node ≥ 20, npm ≥ 10** (workspaces).
- **Supabase** project (Postgres + Auth + RLS).
- **Google Cloud** OAuth client (đăng nhập Google).
- **OpenAI** API key (nghĩa từ gpt-4o-mini) + billing/quota.
- **Chrome** (load unpacked extension).

## Setup (từng bước)

### 1. Cài đặt
```bash
git clone https://github.com/dokhiem2k4/Deutsch-Lernen-Youtube
cd Deutsch-Lernen-Youtube
npm install                 # cài cả web + extension (workspaces)
cp .env.example .env        # rồi điền giá trị (xem §Env bên dưới)
```

### 2. Supabase — DB + keys
1. Tạo project ở https://supabase.com (ghi lại **Project ref**, ví dụ `abcdefgh...`).
2. **Settings → API:** lấy `Project URL`, `anon public` key, `service_role` key.
3. **Apply 3 migration** (`supabase/migrations/`, theo thứ tự tên) — bằng Supabase CLI:
   ```bash
   supabase link --project-ref <REF>
   supabase db push          # chạy 3 migration: init schema+RLS+trigger, rpc get_dashboard, harden grants
   ```
   *(hoặc dán nội dung từng `.sql` vào SQL Editor theo thứ tự.)*
   Kết quả: 3 bảng (`profiles`, `vocabulary`, `ai_meaning_cache`) + RLS + trigger `handle_new_user` + RPC `get_dashboard`.

### 3. Google OAuth (đăng nhập)
1. **Google Cloud Console** → APIs & Services → Credentials → tạo **OAuth client ID** (Web application).
2. **Authorized redirect URI**: `https://<REF>.supabase.co/auth/v1/callback`
3. Supabase **Authentication → Providers → Google**: bật, dán Client ID + Secret.
4. Supabase **Authentication → URL Configuration**: Site URL = `http://localhost:3000`; thêm `http://localhost:3000/auth/callback` vào Redirect URLs.

### 4. OpenAI
1. Tạo API key ở https://platform.openai.com → **API keys**.
2. Bật **billing** (không có credit → 429; app vẫn không vỡ, chỉ trả "Không tra được nghĩa").

## Env

Điền `.env` (root — dùng cho migration/tham chiếu) **và** `web/.env.local` (Next.js đọc). Xem [`.env.example`](.env.example).

| Biến | Ở đâu | Ghi chú |
|------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | web | `https://<REF>.supabase.co` (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | anon key (public) |
| `NEXT_PUBLIC_APP_URL` | web | `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | web | ⚠ **SERVER-ONLY** — chỉ đọc trong Route Handler |
| `OPENAI_API_KEY` | web | ⚠ **SERVER-ONLY** |
| `EXT_SUPABASE_URL` / `EXT_SUPABASE_ANON_KEY` / `EXT_APP_URL` | extension build | **chỉ PUBLIC** (= NEXT_PUBLIC_* tương ứng) |

> ⚠ **Bảo mật:** `SUPABASE_SERVICE_ROLE_KEY` và `OPENAI_API_KEY` **không bao giờ** vào extension hay biến `NEXT_PUBLIC_`/`EXT_`. Extension chỉ nhận anon key + URL. `./init.sh secret` bắt buộc = 0 secret trong `dist`.

## Run (dev, local)
```bash
npm run dev                 # web tại http://localhost:3000
```
Mở http://localhost:3000 → **Đăng nhập với Google** → dùng `/dashboard`, `/tu-vung`, `/hoc-tu-vung`, `/kiem-tra-duc-viet`, `/kiem-tra-viet-duc`.

## Extension (build + load)
```bash
# Build với env PUBLIC (lấy từ web/.env.local). PowerShell:
#   $env:EXT_SUPABASE_URL=...; $env:EXT_SUPABASE_ANON_KEY=...; $env:EXT_APP_URL="http://localhost:3000"; npm run build:ext
# bash:
EXT_SUPABASE_URL=<url> EXT_SUPABASE_ANON_KEY=<anon> EXT_APP_URL=http://localhost:3000 npm run build:ext
```
→ `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn `extension/dist`.
Đăng nhập trên web trước → popup extension hiện email (auth-bridge chia sẻ session). Mở **video YouTube tiếng Đức có phụ đề** → overlay 2 dòng; click 1 từ → thẻ nghĩa + Lưu + loa.

## Tutorial — luồng học đầu-cuối
1. Đăng nhập web bằng Google.
2. Load extension, xem 1 video Đức → thấy phụ đề Đức (trên) + Việt (dưới).
3. Click 1 từ Đức → video pause → thẻ hiện **lemma + article (der/die/das) + nghĩa Việt** → bấm 🔊 nghe → bấm **Lưu**.
4. Về web `/tu-vung` → thấy từ vừa lưu (kèm câu ví dụ, trạng thái *Từ mới*).
5. `/hoc-tu-vung` lật flashcard → từ chuyển *Đã học*. `/kiem-tra-duc-viet` làm quiz (cần ≥4 từ).
6. `/dashboard` xem streak + tổng từ + biểu đồ 30 ngày.

## Verify
```bash
./init.sh all        # scaffold + web (lint/typecheck/build) + extension (build prod) + secret(0)
./init.sh web        # chỉ web       ./init.sh extension   # build + 0 secret
```
Chi tiết bằng chứng từng feature: [`progress.md`](progress.md) §Verification Evidence.

## Troubleshooting
- **Login Google lỗi `redirect_uri_mismatch`** → kiểm redirect URI Google Cloud = `https://<REF>.supabase.co/auth/v1/callback` (khớp tuyệt đối). App đang test (chưa publish) → thêm tài khoản vào **OAuth test users**.
- **Nghĩa từ trả rỗng / "Không tra được"** → `OPENAI_API_KEY` sai/trống hoặc **429 quota** (bật billing). App không vỡ (fallback `source:error`).
- **Overlay không hiện** → video phải **có phụ đề** (CC); mở đúng `youtube.com/watch`; reload tab sau khi load extension; check Console không lỗi.
- **Dòng Việt trống, chỉ có Đức** → YouTube auto-translate (`tlang=vi`) bị chặn anti-bot ("Sorry/automated") → app retry 1 lần rồi hiện nhãn "bản dịch bị chặn". Thử video khác / lát sau.
- **Popup extension không thấy email** → đăng nhập web trước (cùng `NEXT_PUBLIC_APP_URL`/`EXT_APP_URL`); auth-bridge poll ~1.5s; reload popup.
- **`./init.sh secret` báo leak** → có secret trong `extension/dist`; kiểm chỉ inject `EXT_*` PUBLIC, không để `service_role`/`OPENAI` lọt vào source extension.

## Deploy
Hoãn ở MVP (chạy local). Khi deploy web (vd Vercel): đặt env production, `NEXT_PUBLIC_APP_URL` = domain thật, thêm redirect URL vào Google + Supabase; build extension với `EXT_APP_URL` = domain thật rồi publish. Xem [`docs/HANDOVER.md`](docs/HANDOVER.md) §4.
