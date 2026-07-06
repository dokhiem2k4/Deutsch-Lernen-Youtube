# Session Handoff

> Đọc file này đầu phiên. Cập nhật cuối phiên trước khi dừng.

## Bối cảnh nhanh
- Blueprint duyệt: `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md`.
- Harness: `CLAUDE.md` (invariants), `feature_list.json` (state), `.claude/workflow/` (pipeline + security).
- Verify: `./init.sh [scaffold|web|extension|secret|all]`.

## Đang ở đâu (restart markers)
- **Last Updated:** 2026-07-06.
- **Current Objective / Feature active:** F08 — Extension click-word (lookup AI + save + settings). F01–F07 DONE.
- **Recommended Next Step:** F08 — trong overlay (`youtube.ts`): wrap mỗi từ DE thành span click được → click → `video.pause()` → `smApi("POST","/api/lookup-context",{word, sentence=câu DE cue đang hiện})` qua background → popup nghĩa (lemma+article màu + meaning_vi) + nút **Lưu** (`smApi("POST","/api/vocabulary",{word,lemma,article,meaning_vi,example=câu})`) + loa `speechSynthesis` de-DE; click ra ngoài/Đóng → `video.play()`. Settings `{showDe,showVi,bgEnabled,bgOpacity(0..100),fontSizePx(12..32)}` lưu `chrome.storage.local`, popup điều khiển, overlay áp **realtime** (`chrome.storage.onChanged`). Prompt-injection: text phụ đề là untrusted → đã ép JSON schema ở API F04; extension render as text. Chờ Chủ thầu giao TIP-F08.
- **⚠ F08 cần Homeowner:** điền `OPENAI_API_KEY` (`.env` + `web/.env.local`) để lookup trả nghĩa thật; **bật Google OAuth** để login → smApi có JWT. Không có key vẫn code + test fallback (source:error, không 500).
- **F07 runtime cần Homeowner verify (chưa chạy browser):** load unpacked (`extension/dist`) → mở **video YouTube tiếng Đức CÓ phụ đề** → xác nhận (1) overlay 2 dòng Đức+Việt sync currentTime, ẩn khi im lặng; (2) video **no-caption** → overlay im lặng, console không lỗi; (3) VI bị anti-bot → chỉ dòng DE + nhãn "bản dịch bị chặn". Build extension: `cd extension && EXT_SUPABASE_URL=.. EXT_SUPABASE_ANON_KEY=.. EXT_APP_URL=.. node build.mjs --prod` (lấy giá trị từ `web/.env.local` NEXT_PUBLIC_*).
- **Extension F06 nền tảng:** content gọi API qua `smApi(method,path,body)` (`src/lib/apiExt.ts`) → background SM_API proxy (Bearer + refresh). Session do auth-bridge forward.
- **Web F05 sẵn:** `/tu-vung`, `/hoc-tu-vung`, `/kiem-tra-{duc-viet,viet-duc}`, `/dashboard`. Session localStorage key `sb-ealcahjaftwrllbudkyr-auth-token`.
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
