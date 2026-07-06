# Session Handoff

> Đọc file này đầu phiên. Cập nhật cuối phiên trước khi dừng.

## Bối cảnh nhanh
- Blueprint duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`.
- Harness: `CLAUDE.md` (invariants), `feature_list.json` (state), `.claude/workflow/` (pipeline + security).
- Verify: `./init.sh [scaffold|web|extension|secret|all]`.

## Đang ở đâu (restart markers)
- **Last Updated:** 2026-07-06.
- **Current Objective / Feature active:** F09 — SHIP + verify tổng + handover. **F01–F08 DONE (toàn bộ feature code-complete).**
- **Recommended Next Step:** F09 — (1) **README** đầy đủ: setup Supabase + apply 3 migration, bật Google OAuth (redirect `https://ealcahjaftwrllbudkyr.supabase.co/auth/v1/callback`), điền `OPENAI_API_KEY`, chạy web (`npm run dev` trong web/), build extension (`EXT_* node build.mjs --prod`) + load unpacked `extension/dist`. (2) **Handover Diataxis** (tutorial/how-to/reference/explanation). (3) Map mọi REQ Blueprint §? → feature + trạng thái verified. (4) **SHIP gate:** `./init.sh all` xanh + 0 secret. (5) MONITOR post-ship. Cân nhắc **adversarial-verify** toàn bộ + parallel-review diff cuối. Chờ Chủ thầu giao TIP-F09.
- **⚠ Việc CHỜ HOMEOWNER (runtime thật — gate "verified" ở §9 Blueprint, không chặn code/SHIP-gate tĩnh):**
  - Bật **Google OAuth** (Supabase dashboard) → verify: login web (F03), pages browser (F05), popup extension thấy email + auth-bridge (F06), click-từ có JWT (F08).
  - Điền **`OPENAI_API_KEY`** (`.env` + `web/.env.local`) → lookup nghĩa thật (F08 `source:cache/openai`). Fallback (không 500) đã xong.
  - **Load unpacked extension** (`extension/dist`) + video Đức thật → overlay 2 dòng sync (F07), click từ→pause→thẻ→Lưu→loa (F08), settings realtime (F08).
  - Build extension: `cd extension && EXT_SUPABASE_URL=<web NEXT_PUBLIC_SUPABASE_URL> EXT_SUPABASE_ANON_KEY=<anon> EXT_APP_URL=<app url> node build.mjs --prod`.
- **Kiến trúc tổng (cho F09 doc):** web Next15 (auth localStorage JWT + API Route Handler RLS/service_role) + Supabase (3 bảng RLS + RPC) + extension MV3 (auth-bridge đọc session web → SM_API proxy Bearer; yt-intercept MAIN bắt timedtext → overlay ISOLATED; click-từ → lookup-context). Session key `sb-ealcahjaftwrllbudkyr-auth-token`.
- **API:** `GET/POST/DELETE /api/vocabulary`, `POST /api/vocabulary/mark-learned {ids}`, `POST /api/lookup-context {word,sentence}`, `GET /api/dashboard`, `GET /api/me`, `GET /api/health` (public). Bearer JWT (trừ health). CORS phản chiếu web + `chrome-extension://`.
- **Blockers:**
  - **`OPENAI_API_KEY` trống** → `/api/lookup-context` path gọi AI thật chờ Homeowner. Fallback không 500 đã verify. Cần cho F08 click-từ.
  - **Google OAuth** chưa bật → smoke test browser end-to-end F05 (login → list/flashcard/quiz/dashboard) + auth-bridge F06 cần login thật. Test authed hiện dùng user tạo qua service_role.
- **Supabase:** project `ealcahjaftwrllbudkyr` live. `.env`/`web/.env.local` có creds. MCP đang **không** `--read-only`; PAT nên rotate (đã lộ trong chat).
- **Files:** `web/` (Next 15 + auth F03), `extension/` (MV3 scaffold), `supabase/migrations/` (3 .sql applied). `node_modules/` cài rồi.

## Quyết định treo (cần Homeowner)
- Chưa có: Supabase project, Google OAuth client, OpenAI key. → xác nhận trước F02/F03.

## Lần dừng gần nhất
- 2026-07-05: dựng xong harness. Chưa viết code sản phẩm.

## Next Session — cách tiếp tục (clean restart)
1. Đọc `progress.md` + file này.
2. Lấy `active_feature` từ `feature_list.json`, đọc `done_when`+`verify`.
3. Theo `.claude/workflow/pipeline.md`: BUILD → VERIFY(adversarial) → SECURITY → DevEx → SHIP.
4. Cập nhật state + bằng chứng vào `progress.md`; ghi bài học vào harness memory.
