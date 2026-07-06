# Session Handoff

> Đọc file này đầu phiên. Cập nhật cuối phiên trước khi dừng.

## Bối cảnh nhanh
- Blueprint duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`.
- Harness: `CLAUDE.md` (invariants), `feature_list.json` (state), `.claude/workflow/` (pipeline + security).
- Verify: `./init.sh [scaffold|web|extension|secret|all]`.

## Đang ở đâu (restart markers)
- **Last Updated:** 2026-07-06.
- **Current Objective / Feature active:** F05 — Web pages (tu-vung/flashcard/quiz/dashboard). F01+F02+F03+F04 DONE.
- **Recommended Next Step:** F05 — `/tu-vung` (list + xoá + trạng thái Từ mới/Đã học), `/hoc-tu-vung` flashcard (lật thẻ → mark-learned), quiz 2 chiều `/kiem-tra-duc-viet` + `/kiem-tra-viet-duc` (`QuizGame` prop direction, <4 từ chặn có thông báo, ≥4 → 4 đáp án 1 đúng), `/dashboard` streak+chart 30 ngày, components Header/QuizGame/ui/*. **Gọi API F04 qua `lib/apiClient.ts`** (đã kèm Bearer JWT). Có TIP mẫu ở `.claude/tips/` (chờ Chủ thầu giao TIP-F05).
- **API F04 sẵn dùng cho F05:** `GET/POST/DELETE /api/vocabulary`, `POST /api/vocabulary/mark-learned {ids}`, `POST /api/lookup-context {word,sentence}`, `GET /api/dashboard`. Tất cả cần Bearer JWT.
- **Blockers:**
  - **`OPENAI_API_KEY` trống** → `/api/lookup-context` path gọi AI thật (`source:"cache"`/`"openai"`) chờ Homeowner điền key. Fallback `source:"error"` đã verify không 500 → F05 code được (không chặn).
  - **Google OAuth** chưa bật → verify login thật + path token-hợp-lệ end-to-end (Homeowner, redirect `https://ealcahjaftwrllbudkyr.supabase.co/auth/v1/callback`). Test authed đang dùng user tạo qua service_role.
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
