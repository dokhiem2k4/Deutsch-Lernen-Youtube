# Session Handoff

> Đọc file này đầu phiên. Cập nhật cuối phiên trước khi dừng.

## Bối cảnh nhanh
- Blueprint duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`.
- Harness: `CLAUDE.md` (invariants), `feature_list.json` (state), `.claude/workflow/` (pipeline + security).
- Verify: `./init.sh [scaffold|web|extension|secret|all]`.

## Đang ở đâu (restart markers)
- **Last Updated:** 2026-07-06.
- **Current Objective / Feature active:** — ✅ **MVP DONE (F01–F09). SHIP gate PASS.** Không còn feature build; chờ Homeowner nghiệm thu UI Chrome (§9 Blueprint).
- **Recommended Next Step (Homeowner):** chạy §9 Blueprint full-flow trên Chrome để đóng "chờ-Homeowner(UI)":
  1. `npm run dev` → login Google web → duyệt `/tu-vung` `/hoc-tu-vung` `/kiem-tra-*` `/dashboard` (F05).
  2. Build + Load unpacked extension → popup thấy email (F06) → video Đức: overlay 2 dòng (F07) → click từ→pause→thẻ nghĩa→Lưu→loa→đóng→play (F08) → toggle/slider settings realtime (F08).
  3. Chi tiết + troubleshooting: `README.md`; truy vết REQ + verified: `docs/HANDOVER.md`.
  - Housekeeping: **rotate Supabase PAT** (đã lộ). Sau MVP: deploy Vercel + `EXT_APP_URL` prod + publish extension.
- **Đã verified live (Homeowner):** Google OAuth 302; OPENAI lookup thật (Katze→die/mèo openai→cache); extension build env thật 0 secret. SHIP gate `./init.sh all` xanh; `/api/health` 200; advisors 2 intentional.
- **Build extension:** `cd extension && EXT_SUPABASE_URL=<NEXT_PUBLIC_SUPABASE_URL> EXT_SUPABASE_ANON_KEY=<anon> EXT_APP_URL=<app url> node build.mjs --prod` → `extension/dist`.
- **Kiến trúc tổng:** web Next15 (auth localStorage JWT + API Route Handler RLS/service_role) + Supabase (3 bảng RLS + RPC) + extension MV3 (auth-bridge đọc session web → SM_API proxy Bearer; yt-intercept MAIN bắt timedtext → overlay ISOLATED; click-từ → lookup-context). Session key `sb-ealcahjaftwrllbudkyr-auth-token`. Đầy đủ: `docs/HANDOVER.md`.
- **API:** `GET/POST/DELETE /api/vocabulary`, `POST /api/vocabulary/mark-learned {ids}`, `POST /api/lookup-context {word,sentence}`, `GET /api/dashboard`, `GET /api/me`, `GET /api/health` (public). Bearer JWT (trừ health). CORS phản chiếu web + `chrome-extension://`.
- **Còn lại (chỉ Homeowner, Chrome UI):** overlay F07, thẻ click F08, settings realtime F08, pages render F05. Không chặn SHIP gate tĩnh.
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
