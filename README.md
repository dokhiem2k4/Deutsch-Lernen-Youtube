# Deutsch Lernen — YouTube DE→VI

Người Việt học tiếng Đức qua YouTube: phụ đề song ngữ Đức–Việt + click từ tra nghĩa (AI) để lưu,
rồi ôn lại trên web bằng flashcard/quiz. Monorepo: **web** (Next.js 15 full-stack) + **extension** (Chrome MV3).

> Design đã duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`
> Workflow / harness: `CLAUDE.md`, `feature_list.json`, `.claude/workflow/`.

## Cấu trúc
```
web/          Next.js 15 (App Router) — FE + API (Route Handlers)
extension/    Chrome MV3 (esbuild) — phụ đề + click-từ
supabase/     migrations (schema + RLS + RPC)
docs/         spec / design
```

## Yêu cầu
- Node ≥ 20, npm ≥ 10.
- (Về sau) Supabase project + Google OAuth + OpenAI API key — xem `docs/.../mvp-design.md` §10.

## Chạy (dev)
```bash
npm install                 # cài cả web + extension (workspaces)
cp .env.example .env        # điền giá trị (xem bên dưới)
npm run dev                 # web tại http://localhost:3000
npm run build:ext           # build extension -> extension/dist (load unpacked vào Chrome)
```

## Verify
```bash
./init.sh scaffold          # kiểm cấu trúc
./init.sh web               # lint + typecheck + build web
./init.sh extension         # build extension + grep 0 secret trong dist
```

## Biến môi trường
Xem `.env.example`. Lưu ý bảo mật: `SUPABASE_SERVICE_ROLE_KEY` và `OPENAI_API_KEY` **chỉ ở server**
(Route Handler). Extension chỉ nhận giá trị PUBLIC (`EXT_SUPABASE_ANON_KEY`, URL).

## Trạng thái
Đang scaffold (F01). Lộ trình feature: `feature_list.json`.
