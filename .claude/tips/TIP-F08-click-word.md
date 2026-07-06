# TIP-F08 — Click-word (lookup AI + save + speak + subtitle settings)

> **Từ:** Chủ thầu (Contractor) · **Cho:** Thợ thi công (Builder) · **Ngày:** 2026-07-06

## Header
- **Feature ID:** F08 · **Dependencies:** F04 (API lookup/vocabulary), F06 (SM_API proxy), F07 (overlay DE) — DONE
- **Priority:** P0 (feature cuối của build; đóng vòng học từ) · **Effort:** L (~1–1.5 ngày)
- **Blueprint:** §1 (click-từ + settings), §5 (lookup-context), §6 (luồng click-từ + settings + auth) · **Security:** `.claude/workflow/security.md` (A03 render as text, secret 0)

## Context
- **Working dir:** `extension/`
- **Đã có:**
  - **F07 `youtube.ts`** (ISOLATED): overlay 2 dòng trong `#movie_player`, dòng DE có `bubbleDe` text theo cue hiện tại. **F08 mở rộng file này** để mỗi từ Đức click được.
  - **F06 `apiExt.ts`**: `smApi(method, path, body)` → background proxy Bearer (né CORS). SM_API 401 nếu chưa login.
  - **F04 API**: `POST /api/lookup-context {word, sentence}` → `{lemma, article, meaning_vi, word_type, source}` (fallback `source:"error"` không 500); `POST /api/vocabulary {word, lemma, article, meaning_vi, example}` (idempotent).
  - **F06 popup** (`popup.ts/html`): login/logout. **F08 thêm khu Settings** vào popup.
- **speechSynthesis**: API trình duyệt, `lang:"de-DE"` — không cần key/mạng.

## Task
Cho phép **click 1 từ Đức** trên overlay → pause video → tra nghĩa AI (qua SM_API) → **thẻ nghĩa in-page** (lemma + article + nghĩa Việt) + nút **Lưu** + nút **loa** (đọc de-DE). Click ra ngoài → play tiếp. Cộng **cài đặt phụ đề** trong popup (bật/tắt DE/VI, cỡ chữ, độ đậm nền) áp realtime. KHÔNG đổi kiến trúc F07.

### Quyết định kiến trúc (đã chốt — KHÔNG đổi, xung đột → escalate):
- **Thẻ nghĩa = in-page** (do `youtube.ts`/ISOLATED render trong `#movie_player`), KHÔNG phải action-popup. Action-popup (popup.html) chỉ chứa login (F06) + **settings** (F08).
- **Từ để click:** tách `bubbleDe.text` thành các `<span>` từ; click 1 span → dùng **từ đó** làm `word`, **cả câu DE cue hiện tại** làm `sentence`. Strip dấu câu ở 2 đầu khi gửi lookup (giữ nguyên hiển thị).
- **Lookup qua SM_API** (không gọi API trực tiếp): `smApi('POST','/api/lookup-context',{word,sentence})`. Chưa login (401) → thẻ hiện "Đăng nhập để tra nghĩa" + nút mở web. Lỗi/`source:error` → "Không tra được, thử lại" (không vỡ).
- **Lưu:** `smApi('POST','/api/vocabulary',{word, lemma, article, meaning_vi, example:sentence})`. Thành công → nút đổi "Đã lưu ✓" (idempotent nên bấm lại an toàn).
- **Loa:** `speechSynthesis` đọc `word` (hoặc lemma) `lang:"de-DE"`.
- **Pause/play:** click từ → `video.pause()`; đóng thẻ / click ra ngoài → `video.play()` (chỉ play nếu trước đó ta pause).
- **Settings** `settings.ts` model `{showDe, showVi, bgEnabled, bgOpacity:0..100, fontSizePx:12..32}` ở `chrome.storage.local`; popup điều khiển; `youtube.ts` subscribe `chrome.storage.onChanged` → áp realtime (ẩn/hiện dòng, cỡ chữ, nền).
- **Render as text** (meaning_vi/example là dữ liệu — `textContent`, không innerHTML).

## Files (tạo/sửa — chỉ scope F08)
| File | Việc |
|---|---|
| `extension/src/lib/settings.ts` | **MỚI:** `DEFAULT_SETTINGS`, `getSettings()`, `setSettings(patch)`, `clampSettings` (kẹp bgOpacity/fontSizePx), `onSettingsChanged(cb)`. Lưu `chrome.storage.local` key `dl-settings`. |
| `extension/src/lib/words.ts` | **MỚI, pure (test được):** `tokenize(sentence)` → mảng `{raw, clean}` (clean = bỏ dấu câu 2 đầu, giữ chữ Đức ä/ö/ü/ß); `cleanWord(w)`. |
| `extension/src/lib/speak.ts` | **MỚI:** `speakDe(text)` → `speechSynthesis` utterance `lang:"de-DE"` (guard nếu API thiếu). |
| `extension/src/content/youtube.ts` | **MỞ RỘNG (F07):** render `bubbleDe` thành các span từ (click được); click → pause + thẻ nghĩa (lookup + Lưu + loa); click ngoài/đóng → play; subscribe settings → áp realtime (showDe/showVi/bgOpacity/fontSizePx). Giữ nguyên intercept/overlay F07. |
| `extension/src/popup/popup.ts` + `popup.html` | **MỞ RỘNG (F06):** thêm khu "Cài đặt phụ đề": toggle DE/VI, slider cỡ chữ (12–32), slider độ đậm nền (0–100) → `setSettings`. Giữ login/logout. |

> KHÔNG động web/API/SW/auth-bridge/yt-intercept/captions. KHÔNG đổi overlay-core của F07.

## Specifications
- **Tokenize + click:** mỗi lần cue DE đổi, dựng lại spans. Span `cursor:pointer`, hover nhẹ. Click → `e.stopPropagation()`, lấy `clean` word, `sentence` = full cue text.
- **Thẻ nghĩa (in-page):** hiện gần overlay/giữa dưới; nội dung: `article` (tô màu theo giống nếu có) + `lemma` (hoặc word) đậm; `meaning_vi`; `word_type` nhỏ (optional); nút **Lưu**, nút **🔊**, nút **đóng ✕**. `pointer-events:auto` (overlay gốc là none). ESC hoặc click nền → đóng + play.
- **Auth/error trên thẻ:** SM_API `{ok:false,status:401}` → "Đăng nhập để tra nghĩa" + nút mở web. `source:"error"` hoặc `meaning_vi` rỗng → "Không tra được nghĩa, thử lại". Không throw.
- **Settings realtime:** `showDe=false` → ẩn dòng DE; `showVi=false` → ẩn dòng VI; `fontSizePx` → cỡ chữ bubble; `bgEnabled/bgOpacity` → nền đen mờ (rgba alpha = opacity/100). Áp ngay khi popup đổi (qua `onChanged`), và khi load.
- **Popup settings:** đọc `getSettings()` lúc mở, phản ánh trạng thái; đổi control → `setSettings(patch)` (persist). Không cần reload.

## Acceptance Criteria (Gherkin — testable)
```gherkin
# --- Logic tách được (Builder tự test, KHÔNG cần YouTube) ---
Scenario: tokenize giữ chữ Đức + bỏ dấu câu
  When tokenize("Das Haus, ist groß!")
  Then tokens raw giữ nguyên; clean của "Haus," = "Haus"; "groß!" = "groß"; giữ ä/ö/ü/ß

Scenario: clampSettings kẹp biên
  When setSettings({fontSizePx:99, bgOpacity:200})
  Then lưu fontSizePx=32, bgOpacity=100 (kẹp trần); dưới sàn tương tự

Scenario: getSettings default
  Given chrome.storage trống
  When getSettings()  Then trả DEFAULT_SETTINGS (showDe:true, showVi:true, bgEnabled:true, bgOpacity, fontSizePx)

Scenario: Build + secret
  When node build.mjs --prod + typecheck -w extension + ./init.sh extension
  Then dist đủ file; typecheck xanh; 0 secret

# --- Runtime thật (CHỜ HOMEOWNER — cần OAuth + OPENAI + video Đức) ---
Scenario: Click-từ tra + lưu (Homeowner)
  Given đã login (web), OPENAI key có, video Đức có phụ đề
  When click 1 từ Đức trên overlay
  Then video pause; thẻ hiện lemma+article+nghĩa Việt; bấm Lưu → web /tu-vung thấy từ; bấm loa đọc de-DE; đóng → play

Scenario: Chưa login (Homeowner)
  When click từ mà chưa login
  Then thẻ hiện "Đăng nhập để tra nghĩa" + nút mở web (không vỡ)

Scenario: Settings realtime (Homeowner)
  When đổi toggle/slider trong popup
  Then overlay đổi ngay (ẩn dòng / cỡ chữ / độ đậm nền) và persist sau reload
```

## Constraints
- **Stay in scope:** chỉ click-từ + thẻ nghĩa + settings + loa. KHÔNG đổi web/API/SW/intercept/captions/overlay-core F07.
- **Secret 0:** extension không key. `./init.sh extension` phải 0 secret.
- **Render as text** (textContent), không innerHTML cho dữ liệu API. Không throw (mọi lỗi lookup/mạng → thông báo nhẹ trên thẻ).
- **Không thêm dep.** Không gọi API trực tiếp (qua SM_API). `word_id`/`user_id` do server lo (JWT).
- Pause/play chỉ tác động khi ta chủ động (đừng play nếu user tự pause trước đó).

## Cách verify (Builder tự chạy)
1. **Unit-test pure** `words.ts` (tokenize/cleanWord) + `settings.ts` (clamp/default/roundtrip qua mock chrome.storage) — dán kết quả.
2. `node build.mjs --prod` + `typecheck -w extension` + `./init.sh extension` (0 secret).
3. **Contract SM_API** (mint token service_role như F04): `smApi('POST','/api/lookup-context',{word,sentence})` path → 200 (fallback source:error nếu chưa có OPENAI); `POST /api/vocabulary` → lưu được. Đánh dấu phần AI thật "chờ OPENAI".
4. **Runtime click/overlay/settings:** ĐÁNH DẤU "chờ Homeowner" (cần OAuth + video Đức). Ghi hướng dẫn test end-to-end.

## VERIFY của Chủ thầu (sau khi báo done)
`adversarial-verify` criteria = scenario logic + build/secret + securityChecks = ["render meaning as text không innerHTML", "click-từ qua SM_API không gọi API trực tiếp", "chưa login → thông báo không vỡ", "settings clamp biên", "dist 0 secret", "pause/play không tự play khi user đã pause"]. Runtime click defer Homeowner.

## Report Format (Builder điền)
```
STATUS: DONE / PARTIAL / BLOCKED
FILES CHANGED:
TEST RESULTS:  (unit words/settings + build/secret + SM_API contract; runtime click = "chờ Homeowner")
ISSUES DISCOVERED:
DEVIATIONS FROM SPEC:
SUGGESTIONS FOR CHỦ THẦU:
```
