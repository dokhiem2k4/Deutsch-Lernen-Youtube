# Session Handoff

> Đọc file này đầu phiên. Cập nhật cuối phiên trước khi dừng.

## Bối cảnh nhanh
- Blueprint duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`.
- Harness: `CLAUDE.md` (invariants), `feature_list.json` (state), `.claude/workflow/` (pipeline + security).
- Verify: `./init.sh [scaffold|web|extension|secret|all]`.

## Đang ở đâu (restart markers)
- **Last Updated:** 2026-07-06.
- **Current Objective / Feature active:** F06 — Extension scaffold (MV3 + auth-bridge + popup). F01–F05 DONE (web MVP code-complete).
- **Recommended Next Step:** F06 — extension MV3: `manifest.json`, `background/service-worker` (SM_API proxy tới `/api/*`), `content/auth-bridge` (đọc session localStorage web — key `sb-<ref>-auth-token`), popup login/mở web/đăng xuất, lib chỉ chứa **anon key + URL** (KHÔNG service_role/OPENAI). `./init.sh extension` xanh + grep dist **0 secret**. Bắt lỗi "Extension context invalidated" (stop poll). Chờ Chủ thầu giao TIP-F06.
- **F05 web đã xong (dùng để verify cùng extension):** `/tu-vung`, `/hoc-tu-vung`, `/kiem-tra-{duc-viet,viet-duc}`, `/dashboard`. Session lưu localStorage (`supabaseClient` persistSession) → auth-bridge F06 đọc được.
- **API F04/F05 sẵn:** `GET/POST/DELETE /api/vocabulary`, `POST /api/vocabulary/mark-learned {ids}`, `POST /api/lookup-context {word,sentence}`, `GET /api/dashboard`. Bearer JWT. CORS đã phản chiếu `chrome-extension://`.
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
