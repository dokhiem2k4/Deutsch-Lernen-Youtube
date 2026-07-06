# Session Handoff

> Đọc file này đầu phiên. Cập nhật cuối phiên trước khi dừng.

## Bối cảnh nhanh
- Blueprint duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`.
- Harness: `CLAUDE.md` (invariants), `feature_list.json` (state), `.claude/workflow/` (pipeline + security).
- Verify: `./init.sh [scaffold|web|extension|secret|all]`.

## Đang ở đâu (restart markers)
- **Last Updated:** 2026-07-06.
- **Current Objective / Feature active:** F04 — API core (vocabulary + lookup-context AI + dashboard). F01+F02+F03 DONE.
- **Recommended Next Step:** F04 — `/api/vocabulary` (GET/POST/DELETE, idempotent UNIQUE), `/api/vocabulary/mark-learned`, `/api/lookup-context` (cache→gpt-4o-mini, fallback không 500), `/api/dashboard` (RPC get_dashboard). **Tái dùng** `getUserFromRequest` + `corsHeaders` (đã có từ F03). Có TIP mẫu ở `.claude/tips/`.
- **Blockers:**
  - **`OPENAI_API_KEY` trống** → cần cho `/api/lookup-context`. Điền vào `.env` + `web/.env.local`. (Không có key vẫn code + test fallback được.)
  - **Google OAuth** chưa bật → để verify login thật + /api/me path 200 (Homeowner, redirect `https://ealcahjaftwrllbudkyr.supabase.co/auth/v1/callback`).
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
