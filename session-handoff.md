# Session Handoff

> Đọc file này đầu phiên. Cập nhật cuối phiên trước khi dừng.

## Bối cảnh nhanh
- Blueprint duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`.
- Harness: `CLAUDE.md` (invariants), `feature_list.json` (state), `.claude/workflow/` (pipeline + security).
- Verify: `./init.sh [scaffold|web|extension|secret|all]`.

## Đang ở đâu (restart markers)
- **Last Updated:** 2026-07-06.
- **Current Objective / Feature active:** F07 — Extension subtitles (intercept timedtext + overlay DE+VI). F01–F06 DONE.
- **Recommended Next Step:** F07 — `src/content/yt-intercept.ts` (MAIN world, `document_start`, hook fetch/XHR bắt URL `timedtext` **đã ký** player tự gọi: DE `fmt=json3` + VI cùng baseUrl `&tlang=vi`), xử lý anti-bot "Sorry/automated" → retry 1 lần + phân biệt trạng thái VI (ok/blocked/empty), postMessage cues → `youtube.ts`. Bỏ stub `youtube.ts` (ISOLATED): overlay 2 dòng trong `#movie_player` chọn cue theo currentTime + ẩn caption gốc. Cần thêm entry `yt-intercept` vào build.mjs + manifest (world:MAIN, run_at document_start). Chờ Chủ thầu giao TIP-F07.
- **Extension F06 nền tảng cho F07/F08:** content gọi API qua `smApi(method,path,body)` (`src/lib/apiExt.ts`) → background SM_API proxy (Bearer + refresh). Session do auth-bridge forward. F08 click-từ sẽ dùng `smApi("POST","/api/lookup-context",{word,sentence})` + `smApi("POST","/api/vocabulary",...)`.
- **Web F05 sẵn để verify cùng extension:** `/tu-vung`, `/hoc-tu-vung`, `/kiem-tra-{duc-viet,viet-duc}`, `/dashboard`. Session localStorage key `sb-ealcahjaftwrllbudkyr-auth-token`.
- **API sẵn:** `GET/POST/DELETE /api/vocabulary`, `POST /api/vocabulary/mark-learned {ids}`, `POST /api/lookup-context {word,sentence}`, `GET /api/dashboard`. Bearer JWT. CORS phản chiếu `chrome-extension://`.
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
