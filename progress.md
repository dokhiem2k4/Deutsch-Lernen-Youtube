# Progress — Deutsch Lernen

> Cập nhật mỗi khi feature đổi trạng thái. `done` phải kèm **bằng chứng** (output lệnh/test).

## Current State
- **Last Updated:** 2026-07-06.
- **Phase:** ✅ **MVP code-complete + SHIP gate PASS (F01–F09 done).** Còn: Homeowner nghiệm thu UI trên Chrome (§9 Blueprint).
- **Current Objective / Active feature:** — (hết feature build; chờ Homeowner nghiệm thu UI end-to-end).
- **What đã build:** web MVP (F01–F05) + extension đầy đủ (F06 scaffold, F07 subtitles overlay, F08 click-từ+settings+loa) + **F09 SHIP/handover**: `README.md` (setup Supabase/OAuth/OpenAI + apply migration + run + build extension + tutorial + troubleshooting), `docs/HANDOVER.md` (kiến trúc + bảng truy vết 15 REQ §1 + verified-vs-còn-lại + known limitations + next steps).
- **Đã verified live (Homeowner, 2026-07-06):** ✅ Google OAuth (`authorize?provider=google`→302); ✅ OPENAI lookup thật (`Katze`→`{die,"mèo",noun,source:openai}`→gọi lại `source:cache`; Lưu→`/api/vocabulary` thấy); ✅ extension build env thật, 0 secret.
- **Còn lại (chỉ Homeowner — cần Chrome + YouTube, không tự động hoá):** overlay 2 dòng trên video Đức (F07); UI thẻ click-từ + Lưu + loa (F08); settings realtime (F08); web pages sau login thật (F05). Chi tiết `docs/HANDOVER.md` §3.
- **Recommended Next Step:** Homeowner chạy §9 Blueprint full-flow (load unpacked `extension/dist` + video Đức + login web) → chuyển "chờ-Homeowner(UI)" thành verified. Rotate Supabase PAT (đã lộ). Sau MVP: deploy (Vercel) + set `EXT_APP_URL` prod + publish extension.

## Feature board (nguồn: feature_list.json)
| ID | Feature | Deps | Status |
|----|---------|------|--------|
| F01 | Scaffold monorepo | — | done ✓ |
| F02 | Supabase migrations + RLS + RPC | F01 | done ✓ |
| F03 | Web auth (Google + AuthGuard + /api/me) | F01,F02 | done ✓ (login chờ Homeowner OAuth) |
| F04 | API core (vocab + lookup AI + dashboard) | F03 | done ✓ (AI-call path chờ Homeowner OPENAI key) |
| F05 | Web pages (tu-vung/flashcard/quiz/dashboard) | F04 | done ✓ (browser end-to-end chờ Homeowner OAuth) |
| F06 | Extension scaffold (MV3 + auth-bridge + popup) | F04 | done ✓ (login thật chờ Homeowner OAuth) |
| F07 | Extension subtitles (intercept + overlay) | F06 | done ✓ (overlay runtime chờ Homeowner video Đức) |
| F08 | Extension click-word (lookup + save + settings) | F07 | done ✓ (AI verified live; UI click chờ Homeowner Chrome) |
| F09 | SHIP + verify tổng + handover | F05,F08 | done ✓ (SHIP gate PASS; UI end-to-end chờ Homeowner §9) |

## Nhật ký (mới nhất trên cùng)
### 2026-07-06 — F09 SHIP + verify tổng + handover (DONE) [Chủ thầu giao TIP → Thợ làm]
- TIP: `.claude/tips/TIP-F09-ship-handover.md`. Docs Diataxis + SHIP gate + verify tổng, KHÔNG thêm feature/đổi logic.
- Files: **NÂNG CẤP `README.md`** (overview + cây thư mục; Prerequisites; Setup từng bước Supabase keys→apply 3 migration→Google OAuth redirect `https://<ref>.supabase.co/auth/v1/callback`+URL config→OpenAI billing; bảng Env + cảnh báo secret server-only; Run; Extension build EXT_*+Load unpacked; Tutorial luồng học; Verify; Troubleshooting), **MỚI `docs/HANDOVER.md`** (kiến trúc ASCII; bảng truy vết **15 REQ** §1→Feature→Bằng chứng→Verified, 0 mục trống; verified-vs-còn-lại; known limitations; next steps).
- **Bằng chứng SHIP gate + MONITOR:**
  - **`./init.sh all` → VERIFY OK (all):** SCAFFOLD ok; WEB lint 0 warning + build ✓; EXTENSION build PROD; SECRET **0 secret trong dist** (bỏ *.map).
  - **MONITOR:** `/api/health` → **200 `{"status":"ok"}`** (server thật). Advisors(security): **2 mục intentional** (rls_no_policy trên ai_meaning_cache; authenticated execute get_dashboard) — tham chiếu F02 (MCP token không nạp phiên này). 0 P0 mới.
  - **Không hồi quy:** web lint/typecheck/build xanh trong init.sh all (F01–F08 nguyên vẹn).
  - **REQ traceability:** 15 REQ (R1–R15) map đủ IN §1, mỗi mục có Feature+Bằng chứng+Verified, **0 trống**. server-verified: R7–R14 + logic R2/R4/R5/R15; Homeowner-live: R1/R3/R6/R11 (OAuth 302 + Katze openai→cache); chờ-Homeowner(UI): overlay F07 + thẻ click F08 + pages F05 render.
  - README self-review: script `dev`/`build:ext` tồn tại; 3 migration đúng thứ tự tên; **0 giá trị secret thật** trong docs (chỉ tên biến + placeholder `<REF>`).
- **Deviations:** MCP Supabase token không nạp phiên F09 → advisors dẫn kết quả F02 (không re-query live). Không sửa code sản phẩm (verify tổng không lộ bug mới).
- **Kết:** ✅ **BUILD MVP hoàn tất (F01–F09).** SHIP gate PASS. Còn nghiệm thu UI Chrome = Homeowner (§9 Blueprint).

### 2026-07-06 — Homeowner setup verified (OAuth + OPENAI) [server-side live]
- Google OAuth bật (Google Cloud client + Supabase provider + URL config) → verified `authorize` 302 → Google.
- OPENAI_API_KEY: key đầu hết quota (429 insufficient_quota → fallback source:error, không 500 — invariant giữ). Key mới có credit → lookup-context thật: Haus→das/nhà, Katze→die/mèo; `source:openai` → gọi lại `source:cache`; Lưu → web thấy. Chuyển F04 AI-path + F08 lookup từ "chờ Homeowner" → verified (server-side).
- Extension rebuild với env thật (anon+URL public baked, 0 secret). Còn lại: overlay/click UI trên Chrome+YouTube = Homeowner tự nghiệm thu.

### 2026-07-06 — F08 Click-word + settings (DONE) [Chủ thầu giao TIP → Thợ làm → VERIFY bắt 1 bug]
- TIP: `.claude/tips/TIP-F08-click-word.md`. Kiến trúc chốt: thẻ nghĩa **in-page** (youtube.ts render trong #movie_player, KHÔNG action-popup); lookup qua **SM_API** (không gọi API trực tiếp); pause khi click từ, play khi đóng/click-ngoài **chỉ nếu ta chủ động pause**; settings `chrome.storage.local` realtime; render as text.
- **VERIFY (adversarial-verify 17 agent): 1 finding confidence HIGH (2 agent độc lập xác nhận, judge-confirmed):** `pausedByUs` stale — click từ (pause, cờ=true) → thẻ mở → user Space▶ (play; keydown không đóng thẻ, cờ vẫn true) → Space⏸ (user tự pause) → Đóng → `closeCard` ép `play()` video user cố tình dừng. Vi phạm "không tự play nếu user đã pause".
- **Đã vá:** listener `video.'play'` khi ta pause → user chạy lại bằng bất kỳ cách nào → nhả `pausedByUs`; `closeCard` chỉ play nếu còn sở hữu. Trace state-machine: bug-case KHÔNG ép play ✓; normal-case play lại đúng ✓. build+typecheck+secret xanh.
- Bằng chứng Thợ (trước VERIFY): words.ts+settings.ts 17 unit PASS; SM_API contract (lookup fallback source:error không 500, vocabulary idempotent lưu→web thấy); 0 innerHTML (createElement/textContent); 0 secret.
- Files (extension): `src/lib/words.ts` (MỚI, pure: tokenize/cleanWord giữ ä/ö/ü/ß), `src/lib/settings.ts` (MỚI: DEFAULT/get/set/clampSettings/onSettingsChanged, key dl-settings), `src/lib/speak.ts` (MỚI: speakDe de-DE guard), `src/content/youtube.ts` (MỞ RỘNG F07: span từ click được → pause + thẻ lookup+Lưu+loa, click ngoài→play, settings realtime CSS var; giữ nguyên overlay-core/intercept F07), `src/popup/popup.ts`+`.html` (MỞ RỘNG F06: khu Cài đặt phụ đề). **Không** đổi manifest/build.mjs (lib import, không phải content-script mới).
- **Bằng chứng (unit-test REAL source qua esbuild bundle; build/secret; SM_API contract live):**
  - `words.ts` + `settings.ts` **17/17 unit PASS**: tokenize ("Das Haus, ist groß!"→clean Haus/groß, giữ ß, geht's, ''→[]); clampSettings (fontSizePx 99→32, 5→12; bgOpacity 200→100, -5→0; thiếu→default; kiểu sai→default); getSettings storage trống→DEFAULT; setSettings persist+clamp+merge.
  - `typecheck` xanh; `build --prod` xanh (youtube.js 9.1kb); `./init.sh extension` **0 secret**.
  - Render as text: **0 `.innerHTML`/`outerHTML`/`document.write`** (chỉ createElement/textContent). youtube.ts **không fetch trực tiếp** (chỉ smApi).
  - **SM_API contract (proxyFetch replica, user test service_role, web :3000):** lookup-context (OPENAI trống)→**200 source:error meaning_vi=""** (thẻ "Không tra được"); token sai→**401** (thẻ "Đăng nhập để tra"); Lưu payload đầy đủ {word,lemma,article,meaning_vi,example}→**200** (article=das, example set); web /tu-vung thấy; re-save trùng→same row (idempotent).
- **Chờ Homeowner (runtime end-to-end):** OAuth + OPENAI + video Đức → click từ→pause→thẻ nghĩa thật→Lưu→web /tu-vung→loa de-DE→đóng→play; toggle/slider popup→overlay đổi realtime + persist reload.
- **Deviations:** (1) "click ngoài→play" dùng `document pointerdown` capture khi thẻ mở + phát hiện video `play` gián tiếp — align với YouTube (state đang pause, cả hai đều muốn play → không xung đột). (2) Thẻ nghĩa in-page tự tô màu article (der/die/das) inline (không import lib web). (3) Loa phát ngay khi click từ (trước cả lookup) cho phản hồi nhanh.

### 2026-07-06 — F07 Extension subtitles (DONE, logic) [Chủ thầu giao TIP → Thợ làm]
- TIP: `.claude/tips/TIP-F07-extension-subtitles.md`. Kiến trúc chốt: hook fetch/XHR ở MAIN world bắt URL timedtext **đã ký** player tự gọi → refetch DE (fmt=json3) + VI (tlang=vi) từ chính baseUrl (không tự dựng URL → né anti-bot); MAIN→ISOLATED qua `window.postMessage`; overlay + currentTime ở ISOLATED.
- Files (extension): `src/lib/captions.ts` (MỚI, pure: parseJson3/pickCue/isAntiBot/buildUrl), `src/content/yt-intercept.ts` (MỚI, MAIN/document_start: patch fetch+XHR, anti-bot VI retry 1 lần → blocked, không chặn request gốc), `src/content/youtube.ts` (THAY stub, ISOLATED: overlay 2 dòng #movie_player, pickCue theo currentTime, ẩn caption gốc bằng CSS, reset khi SPA đổi video), `manifest.json` (+yt-intercept `world:"MAIN"` document_start), `build.mjs` (+entry yt-intercept).
- **Bằng chứng (unit-test REAL captions.ts qua esbuild bundle → node; build/secret):**
  - `captions.ts` **20/20 unit test PASS**: parseJson3 (3 cue từ 5 event, bỏ rỗng, ms→s, json hỏng→[], object input), pickCue (max-start, t=3→A, t=4.5→null, t=6→B, overlap→max-start, biên inclusive/exclusive), isAntiBot (Sorry/unusual→true, json3→false, rỗng→false), buildUrl (giữ signature, fmt=json3, DE bỏ tlang, VI tlang=vi, ghi đè fmt cũ).
  - `typecheck` xanh; `build --prod` xanh; dist có `yt-intercept.js`; manifest `world:"MAIN"`+`document_start` đúng.
  - `./init.sh extension` **0 secret** (init.sh nay đã bỏ qua `*.map` — Homeowner áp dụng đề xuất F06).
  - Security: ISOLATED chỉ tin `e.source===window && d.source==='DL'`; MAIN `return origFetch/origOpen` (không chặn gốc); try/catch bọc tick + patch (không throw khi no-caption).
- **Chờ Homeowner (runtime video Đức thật):** load unpacked → mở video YouTube tiếng Đức CÓ phụ đề → xác nhận overlay 2 dòng Đức+Việt sync currentTime; video no-caption → im lặng không lỗi; VI bị chặn → chỉ DE + nhãn. Hướng dẫn ở session-handoff.
- **Deviations:** (1) VI blocked hiển thị nhãn "— bản dịch tự động bị chặn —" ở dòng VI khi có DE (TIP: "chỉ DE + nhãn"). (2) Dùng `requestAnimationFrame` loop cho overlay sync (mượt, rẻ) thay poll interval. (3) dedupe timedtext theo base (bỏ fmt/tlang) + clear khi `yt-navigate-finish` (SPA).

### 2026-07-06 — F06 Extension scaffold (DONE) [Chủ thầu giao TIP → Thợ làm]
- TIP: `.claude/tips/TIP-F06-extension-scaffold.md`. Kiến trúc chốt: extension CHỈ anon+URL; auth-bridge đọc localStorage web → forward session → background (`chrome.storage.local`); content gọi API qua message `SM_API` → background fetch Bearer (né CORS); 401 → refresh REST 1 lần → retry → fail thì logout; guard context-invalidated.
- Files (extension): `manifest.json` (MV3, `permissions:["storage"]`, host_permissions=APP_ORIGIN+youtube, **không `<all_urls>`**, content_scripts auth-bridge@APP_URL + youtube stub), `src/lib/{env,supabaseExt,apiExt}.ts`, `src/background/service-worker.ts`, `src/content/auth-bridge.ts` (MỚI), `src/popup/popup.ts`+`.html` (thay stub), `build.mjs` (thêm entry auth-bridge + thay `__APP_ORIGIN__` theo EXT_APP_URL). `youtube.ts` giữ stub.
- **Bằng chứng runtime (`next start` :3000 + user test service_role rồi xoá; replica pure-fn như F04/F05):**
  - `typecheck` xanh (thêm `declare const process` type-only, không thêm @types/node/dep).
  - `./init.sh extension` build dev+prod xanh; **SECRET P0: 0 secret trong dist** (anon key public có mặt; 0 service_role/OPENAI trong `.js/.json/.html`).
  - Manifest: `permissions:["storage"]`, host cụ thể (localhost:3000 + youtube), **không `<all_urls>`**; `__APP_ORIGIN__` thay đúng.
  - `STORAGE_KEY` = `sb-ealcahjaftwrllbudkyr-auth-token` (đúng ref).
  - `parseSession`: bọc `{currentSession}` + phẳng đều parse; rác → null.
  - `SM_API` (proxyFetch) GET /api/me token đúng → **ok:true 200** (id+email); token sai → **ok:false 401 KHÔNG throw**; POST body → ok:true.
  - `refreshSession` REST (anon apikey): access_token mới (rotate) + hoạt động qua proxy; refresh sai → **null (logout path)**.
  - auth-bridge guard: `if(!chrome.runtime?.id){clearInterval;return}` + try/catch quanh sendMessage (không loop khi context invalidated).
- **Chờ Homeowner:** load unpacked Chrome + login Google thật để verify auth-bridge forward session end-to-end (cần OAuth). Logic + contract đã verify qua replica + live API.
- **Deviations:**
  1. **Secret grep false-positive** ban đầu: comment nguồn chứa chữ "service_role/OPENAI" lọt vào dev `.map` → init.sh báo FAIL. Không phải leak thật (`.js/.json/.html` sạch). Đổi comment env.ts (không dùng token literal) → grep sạch. **Đề xuất harness:** cân nhắc init.sh secret bỏ qua `*.map` hoặc chỉ scan artifact ship (prod không có map).
  2. Thêm message `SM_LOGOUT` (popup Đăng xuất) + popup đọc `chrome.storage.local` trực tiếp (không thêm message SM_GET_STATUS) — trong tinh thần TIP.
  3. Manifest match/host dùng placeholder `__APP_ORIGIN__` thay lúc build (giữ khớp EXT_APP_URL) — prod deploy cần set EXT_APP_URL đúng domain.

### 2026-07-06 — F05 Web pages (DONE) [Chủ thầu giao TIP → Thợ làm inline]
- TIP: `.claude/tips/TIP-F05-web-pages.md`. Thực thi **inline tuần tự** (không parallel-build): 4 trang nhỏ + chia sẻ type/QuizGame → cohesion UI + tiết kiệm token.
- Files (web): shared `lib/article.ts` (type Vocab + articleColor der=blue/die=pink/das=green/null=gray), `components/ui/{Button,Card,Badge,Spinner}.tsx`, `components/Header.tsx` (nav active + email + Đăng xuất); trang `app/tu-vung/page.tsx`, `app/hoc-tu-vung/page.tsx`, `components/QuizGame.tsx` (dùng chung, prop direction), `app/kiem-tra-duc-viet/page.tsx` + `app/kiem-tra-viet-duc/page.tsx`, thay `app/dashboard/page.tsx` (streak+3 stat+chart div thuần).
- Kiến trúc giữ đúng: không thêm dep (chart div/SVG thuần), articleColor, distractor = random từ vocab (không AI), flashcard lật → mark-learned, render as text (không innerHTML).
- **Bằng chứng runtime (`next start` :3124 + user test service_role rồi xoá):**
  - `./init.sh web` VERIFY OK — **0 ESLint warning/error** (đã bỏ `round` useMemo hack → giữ `questions` ở state), build 16 route (5 trang F05 static).
  - 5 trang serve **200** + shell AuthGuard "Đang tải…" (AuthGuard bọc mọi trang; chưa login → redirect client).
  - Data-contract khớp trang: seed 3 từ → quizPool 3 → **quiz BLOCKED (<4)**; seed 5 → **quiz RUNS (≥4)**, order newest-first.
  - `buildQuiz` (test trên pool thật): 5 câu, mỗi câu **4 option, chứa đáp án đúng, unique, distractor từ vocab**.
  - Flashcard: mark-learned 1 từ → `learned_at` set. Dashboard: total_words=5, learned=1, streak=1, chart[30], đủ 5 khoá. tu-vung DELETE → biến mất, count giảm.
  - Security greps: 0 `innerHTML`, không gọi supabase trực tiếp ở trang (chỉ Header `signOut`), chỉ `apiFetch`, `package.json` không đổi (0 dep mới).
- **Chờ Homeowner:** smoke test browser end-to-end (login Google → list/flashcard/quiz/dashboard hiển thị) cần bật OAuth. Logic + data-path đã verify qua user test.
- **Deviations:** feature_list §F05 scope có "article tô màu der/die/das" nhưng **TIP-F05 không liệt kê** → giữ đúng scope TIP. **Chủ thầu chốt:** "article tô màu" CHÍNH là `articleColor` đã làm (không có feature "bài đọc mẫu" nào — Thợ nhầm khái niệm). Không có gap, không cần F05.1.
- **VERIFY (Chủ thầu, adversarial-verify 13 agent):** 11/12 ok. **1 finding confidence HIGH (judge-confirmed):** QuizGame chọn distractor theo `id`, không dedup theo text → 2 từ đồng nghĩa (sehen/schauen = "nhìn") tạo 2 nút trùng chữ, bấm nút đúng-nhìn-thấy kia bị chấm SAI. **Đã vá:** `buildQuiz(pool, direction)` dedup distractor theo text hiển thị. Unit-test 5000 câu trên pool synonym → 0 bad (text unique + đúng 1 đáp án). `./init.sh web` xanh.

### 2026-07-06 — F04 API core (DONE) [Chủ thầu giao TIP → Thợ làm]
- TIP: `.claude/tips/TIP-F04-api-core.md`. Kiến trúc chốt: vocab/mark-learned/dashboard qua scoped-JWT (RLS); lookup-context verify user (401) rồi cache+OpenAI bằng service_role; user_id luôn từ JWT.
- Files (web): `lib/supabaseAdmin.ts` (service_role, server-only), `lib/openai.ts` (lookupWord gpt-4o-mini, ép JSON schema, validate article, prompt-injection guard), `app/api/vocabulary/route.ts` (GET/POST idempotent/DELETE/OPTIONS), `app/api/vocabulary/mark-learned/route.ts`, `app/api/lookup-context/route.ts` (cache→AI→cache, fallback không 500), `app/api/dashboard/route.ts`.
- **Bằng chứng runtime (server prod thật, user test tạo qua service_role rồi xoá):**
  - 401 sweep 6 route không token → **401**; `/api/health` → 200 (xem block dưới).
  - POST idempotent: dup "Haus" → **cùng id, meaning_vi KHÔNG bị overwrite** ("ngôi nhà" giữ nguyên).
  - Spoof `user_id` trong body → bị bỏ qua (dùng user.id từ JWT).
  - mark-learned `[]` → no-op 200; `[id]` → `learned_at` set (verify GET).
  - GET order newest-first đúng; DELETE của mình → biến mất, count giảm.
  - **lookup-context fallback (OPENAI trống): 200 `source:"error"`, `meaning_vi:""` — KHÔNG 500** (invariant chính).
  - lookup thiếu sentence → 400; dashboard → 200 đủ 5 khoá + chart[30].
  - CORS: OPTIONS chrome-extension → 204 ACAO phản chiếu; origin lạ → không ACAO; **không `*`** trên mọi route.
  - `./init.sh web` VERIFY OK; `./init.sh secret` = 0 secret.
- **Chờ Homeowner:** điền `OPENAI_API_KEY` → verify `source:"cache"`/`source:"openai"` (gọi AI thật). Fallback đã xong.
- Deviations: mark-learned dùng `new Date().toISOString()` (giờ server) thay `now()` DB — supabase-js không set now() trực tiếp; kết quả tương đương.
- **VERIFY (Chủ thầu, adversarial-verify 15 agent):** 13/14 ok. 1 finding (confidence low, tự judge vì 1 agent chết auth): `lookupWord` fetch **không timeout** → nếu OpenAI treo → hang → platform 5xx, vỡ invariant "không 500". **Đã vá:** AbortController 12s + `maxDuration=20` cho route. Re-verify runtime: lookup fallback vẫn **200 source:error** (không 500). Fix sync vào harness-kit template.

### 2026-07-06 — F03 Web auth (DONE, code-complete) [Chủ thầu giao TIP → Thợ làm]
- TIP: `.claude/tips/TIP-F03-web-auth.md`. Chốt kiến trúc: session localStorage (không cookie/SSR) + API Bearer JWT stateless.
- Files (web): `lib/{supabaseClient,supabaseServer,cors,apiClient}.ts`, `hooks/useUser.ts`, `components/AuthGuard.tsx`, `app/page.tsx` (nút Google), `app/auth/callback/page.tsx`, `app/dashboard/page.tsx` (placeholder), `app/api/me/route.ts`. Thêm dep `@supabase/supabase-js`.
- **Bằng chứng (runtime curl, server thật):** /api/me không token → **401** `{"error":"unauthorized"}`; token sai → 401; OPTIONS Origin chrome-extension → 204 + ACAO phản chiếu (không `*`); OPTIONS origin lạ → không ACAO. `./init.sh web` VERIFY OK.
- Fix: đổi `<a>` nội bộ → `next/link` (ESLint no-html-link-for-pages).
- **Chờ Homeowner:** path token-hợp-lệ (200 profile) + login Google thật cần bật Google OAuth. `/api/me` KHÔNG dùng service_role (đúng spec).

### 2026-07-06 — F02 Supabase migrations (DONE)
- Tạo project Supabase `deutsch-lernen` ref **ealcahjaftwrllbudkyr** (org DeutschLernen `iphytjwzblypdkpwuydh`, ap-southeast-1, free plan $0) qua Management API (MCP chưa nạp token kịp → dùng curl PAT).
- Apply 3 migration: `001_init` (profiles/vocabulary/ai_meaning_cache + RLS + trigger handle_new_user), `002_rpc` (get_dashboard), `003_harden_function_grants` (revoke execute khỏi public/anon).
- **Bằng chứng:** RLS bật cả 3 bảng; profiles 2 policy, vocabulary 4 policy, ai_meaning_cache 0 policy (đúng chủ đích); 2 func SECURITY DEFINER; trigger gắn auth.users; anon gọi get_dashboard → **401 permission denied** (REST test thật).
- **Advisors (security):** còn 2 mục INTENTIONAL (rls_enabled_no_policy trên cache; authenticated execute get_dashboard = thiết kế RPC). WARN public/anon-execute đã fix ở 003. 0 P0.
- `.env` + `web/.env.local` ghi URL+anon+service_role (gitignored — check-ignore pass).
- Deviations: dùng curl thay MCP (token nạp lúc restart nhưng chưa điền kịp). DB password lưu ở scratch (resettable ở dashboard).
- Chưa test được: cross-user RLS trên data thật (cần user auth → verify ở F03/F04 với Homeowner).

### 2026-07-05 — F01 Scaffold monorepo (DONE)
- Tạo: root `package.json` (workspaces web+extension), `.gitignore`, `.env.example`, `README.md`.
- `web/`: Next.js 15 App Router (layout, page, `app/api/health`, globals Tailwind v4, tsconfig, next.config.ts, eslint).
- `extension/`: MV3 (`manifest.json`) + `build.mjs` (esbuild, format iife, define chỉ inject PUBLIC env) + stubs service-worker/youtube/popup.
- `supabase/migrations/` (.gitkeep, chờ F02).
- **Bằng chứng:** `./init.sh all` → VERIFY OK (xem mục dưới). `npm install` sạch (343 pkg; 3 moderate vuln — theo dõi ở §9).
- Deviations: không có. Đã bỏ `next/font` Google để tránh phụ thuộc mạng lúc build (dùng font mặc định; Inter thêm ở F05).

### 2026-07-05 — Harness setup
- Tạo harness: `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`, `init.sh`, `.claude/workflow/{pipeline,security}.md`.
- Bổ sung so với vibecode-kit: SHIP, MONITOR, adversarial VERIFY, SECURITY(STRIDE/OWASP), DevEx, Diataxis docs, guardrails (/careful,/freeze), secret-leak grep trong init.sh.
- Bằng chứng: N/A (chưa có code để verify).

## Verification Evidence (command and output — dán vào đây khi có)
### F09 — SHIP gate + MONITOR (2026-07-06)
```
./init.sh all:
  ==> SCAFFOLD: root package.json OK
  ==> WEB: ✔ No ESLint warnings or errors; ✓ Compiled successfully
  ==> EXTENSION: build PROD (= artifact ship) -> dist/
  ==> SECRET LEAK: OK 0 secret trong dist (artifact ship, bỏ *.map)
  VERIFY OK (all)

MONITOR:
  GET /api/health -> 200 {"status":"ok"}
  Supabase advisors(security) -> 2 mục intentional (F02): rls_enabled_no_policy(ai_meaning_cache),
    authenticated-execute get_dashboard. 0 P0 mới. [MCP token không nạp phiên này → dẫn F02]

REQ traceability (docs/HANDOVER.md §2): 15 REQ (R1–R15), map đủ IN §1, 0 mục trống.
docs self-review: npm run dev/build:ext OK; 3 migration đúng thứ tự; 0 giá trị secret thật trong docs.
```


### F08 — unit (words+settings) + build/secret + SM_API contract (2026-07-06)
```
esbuild bundle words.ts + settings.ts → node → 17 passed, 0 failed:
  tokenize "Das Haus, ist groß!" → 4 tok, clean Haus/groß (giữ ß), «Übung»→Übung, geht's→geht's, ''→[]
  clampSettings fontSizePx 99→32 / 5→12; bgOpacity 200→100 / -5→0; {}→DEFAULT; showDe='x'→true
  getSettings empty→DEFAULT; setSettings persist(fontSizePx 40→32) + showVi=false + others default

typecheck xanh; build --prod (youtube.js 9.1kb, popup.js 2.9kb); ./init.sh extension → 0 secret
render as text: 0 .innerHTML/outerHTML/document.write; youtube.ts không fetch trực tiếp (chỉ smApi)

SM_API contract (proxyFetch replica, user test service_role, web :3000):
  lookup-context {word,sentence} OPENAI trống -> ok=true 200 source=error meaning_vi="" (KHÔNG 500)
  lookup-context token sai                     -> ok=false 401 (thẻ "Đăng nhập để tra nghĩa")
  vocabulary save {word,lemma,article,meaning_vi,example} -> 200 article=das example set
  GET vocabulary -> Haus present, article+example set (web /tu-vung đọc cùng)
  re-save dup    -> 200 same row, meaning_vi giữ "ngôi nhà" (idempotent)
  [AI meaning thật source cache/openai -> chờ Homeowner OPENAI]
```

### F07 — unit-test captions.ts + build/secret (2026-07-06)
```
esbuild bundle src/lib/captions.ts → node → 20 passed, 0 failed:
  parseJson3: 3 cue/5 event (bỏ rỗng), joins+trim, ms→s, json hỏng→[], object input
  pickCue: t=3→A(start2), t=4.5→null(gap), t=6→B(start5), overlap→max-start,
           biên t=start inclusive, t=start+dur exclusive
  isAntiBot: Sorry/automated→true, unusual traffic→true, json3→false, rỗng→false
  buildUrl: DE giữ signature + fmt=json3 + bỏ tlang; VI tlang=vi + fmt=json3 + signature;
            ghi đè fmt=srv3 cũ → json3

typecheck -w extension -> OK
build --prod -> dist: service-worker, auth-bridge, yt-intercept, youtube, popup, manifest, popup.html
manifest yt-intercept: run_at=document_start, world=MAIN (đúng)
./init.sh extension -> SECRET LEAK OK: 0 secret trong dist (artifact ship, bỏ qua *.map)
security: ISOLATED chỉ nhận source:'DL' + same window; MAIN return origFetch/origOpen (không chặn)
```

### F06 — runtime (2026-07-06, `next start` :3000 + user test service_role → xoá)
```
extension typecheck -> OK (declare const process type-only; 0 dep mới)
./init.sh extension  -> build dev+prod xanh; SECRET LEAK: OK 0 secret trong dist; VERIFY OK (extension)
dist: service-worker.js, auth-bridge.js, youtube.js, popup.js, popup.html, manifest.json
manifest: permissions=["storage"]; host_permissions=[http://localhost:3000/*, https://www.youtube.com/*]; all_urls=0
secret grep shippable (.js/.json/.html): 0 service_role/OPENAI (anon key public có mặt)

contract (replica pure-fn vs live API + Supabase):
  STORAGE_KEY = sb-ealcahjaftwrllbudkyr-auth-token (đúng)
  parseSession wrapped {currentSession} -> ok; plain -> ok; garbage/null -> null
  SM_API GET /api/me (token đúng)  -> ok=true  status=200 (id+email)
  SM_API GET /api/me (token sai)   -> ok=false status=401  (KHÔNG throw)
  SM_API POST /api/vocabulary body -> ok=true  status=200 word=Hund
  refreshSession(refresh_token)    -> access_token mới (rotate) + hoạt động qua proxy
  refreshSession(sai)              -> null (logout path)
  auth-bridge guard chrome.runtime.id undefined -> clearInterval (không loop)
```

### F05 — runtime (2026-07-06, `next start` :3124, user test service_role → xoá)
```
./init.sh web -> VERIFY OK; ✔ No ESLint warnings or errors; build 16 routes
                 (5 F05 pages static: /tu-vung /hoc-tu-vung /kiem-tra-duc-viet /kiem-tra-viet-duc /dashboard)

page serve (no SSR crash):
  /tu-vung /hoc-tu-vung /kiem-tra-duc-viet /kiem-tra-viet-duc /dashboard -> 200 + AuthGuard "Đang tải…" shell

authed data-contract (JWT test user):
  seed 3 từ -> quizPool=3 -> quiz BLOCKED (<4) = true
  seed 5 từ -> quizPool=5 -> quiz RUNS (>=4) = true; order newest-first [Buch,laufen,Katze,Hund,Haus]
  buildQuiz(pool5): questions=5 each4opts=true containsAnswer=true uniqueOpts=true distractorsFromVocab=true
  flashcard flip: mark-learned "Buch" -> learned_at set = true
  dashboard: total_words=5 total_learned=1 streak=1 chartLen=30 (đủ 5 khoá)
  tu-vung delete -> gone=true count=4

security greps:
  dangerouslySetInnerHTML/innerHTML -> none
  supabase.* trong trang -> chỉ Header signOut (đúng)
  fetch trong trang -> chỉ apiFetch
  package.json -> unchanged (0 dep mới)
```

### F04 — runtime (2026-07-06, `next start` :3123, user test service_role → xoá)
```
401 sweep (no token):
  GET/POST/DELETE /api/vocabulary          -> 401
  POST /api/vocabulary/mark-learned        -> 401
  POST /api/lookup-context                 -> 401
  GET  /api/dashboard                      -> 401
  GET  /api/health (public)                -> 200 {"status":"ok"}

authed (JWT từ signInWithPassword):
  GET vocabulary empty                     -> 200 []
  POST Haus #1                             -> 200 id=5ee7… article=das
  POST Haus #2 (dup, meaning khác)         -> 200 SAME id, meaning_vi="ngôi nhà" (KHÔNG overwrite)
  POST Buch {user_id spoof}                -> 200 (bỏ qua body user_id)
  mark-learned []                          -> 200 {"ok":true} (no-op)
  mark-learned [Haus]                      -> 200; GET: Haus.learned_at != null
  GET order                                -> newest-first (Buch trước)
  DELETE Buch                              -> 200 {"ok":true}; GET: has Buch=false, count=1
  lookup-context (OPENAI trống)            -> 200 source="error" meaning_vi="" (KHÔNG 500)
  lookup-context {word only}               -> 400 {"error":"word and sentence required"}
  dashboard                                -> 200 keys=[total_learned,total_words,streak,today_active,chart] chartLen=30

CORS:
  OPTIONS /api/vocabulary Origin chrome-extension://x -> 204; ACAO==origin
  OPTIONS /api/lookup-context Origin https://evil.com -> 204; (không ACAO)
  mọi route: KHÔNG "*"

./init.sh web -> VERIFY OK (build 8 routes)
./init.sh secret -> OK: 0 secret trong dist
```

### F03 — runtime curl (2026-07-06)
```
GET  /api/me                              -> 401 {"error":"unauthorized"}
GET  /api/me  Bearer invalid.token        -> 401
OPTIONS /api/me  Origin chrome-extension  -> 204; ACAO: chrome-extension://abcdef; ALLOW-HEADERS: Authorization, Content-Type
OPTIONS /api/me  Origin https://evil.com  -> (không ACAO — đúng)
./init.sh web -> VERIFY OK (build 6 routes: /, /api/health, /api/me, /auth/callback, /dashboard)
```

### F01 — `./init.sh all` (2026-07-05) → VERIFY OK (exit 0)
```
==> SCAFFOLD: package.json OK, .env.example OK, README.md OK
==> WEB: ✔ No ESLint warnings or errors; ▲ Next.js 15.5.20
    ✓ Compiled successfully in 7.6s; Linting/type-check OK; ✓ Generating static pages (5/5)
    Route: / (○ static), /api/health (ƒ dynamic), /_not-found
==> EXTENSION: esbuild -> dist/ (service-worker.js, youtube.js, popup.js, manifest.json, popup.html)
==> SECRET LEAK: OK: 0 secret trong dist
VERIFY OK (all)
```
