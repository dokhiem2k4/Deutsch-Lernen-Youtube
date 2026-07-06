# TIP-F07 — Extension subtitles (intercept timedtext + overlay DE+VI)

> **Từ:** Chủ thầu (Contractor) · **Cho:** Thợ thi công (Builder) · **Ngày:** 2026-07-06

## Header
- **Feature ID:** F07 · **Dependencies:** F06 (extension scaffold, manifest, build) — DONE
- **Priority:** P0 (lõi trải nghiệm extension) · **Effort:** L (~1–1.5 ngày; khó nhất về runtime)
- **Blueprint:** §1 (extension IN), §6 (luồng kỹ thuật — phụ đề/overlay), §8 (lỗi: no-caption im lặng, anti-bot) · **Security:** `.claude/workflow/security.md` (A10 SSRF — chỉ fetch baseUrl đã ký + tlang)

## Context
- **Working dir:** `extension/`
- **Đã có (F06):** manifest MV3, `build.mjs` (entry: service-worker, auth-bridge, youtube, popup), `src/content/youtube.ts` = **stub** (F07 làm bản thật), `src/lib/*`. SM_API/auth KHÔNG dùng ở F07 (phụ đề là client thuần).
- **Cơ chế YouTube:** player tự gọi URL `timedtext` **đã ký** (có `signature`/`pot`) khi có caption. Ta **không tự dựng URL** (anti-bot chặn) → **hook fetch/XHR bắt URL player gọi**, rồi refetch:
  - **DE** = baseUrl + `&fmt=json3` (track gốc tiếng Đức).
  - **VI** = **cùng baseUrl** + `&tlang=vi` + `&fmt=json3` (YouTube auto-translate).
- **2 world:** hook `window.fetch` phải chạy ở **MAIN world** (ISOLATED không thấy fetch của trang). Overlay + đọc `video.currentTime` chạy ISOLATED. Giao tiếp MAIN→ISOLATED qua `window.postMessage`.

## Task
Chèn phụ đề song ngữ Đức (trên) + Việt (dưới) lên video YouTube, đồng bộ `currentTime`. Bắt caption qua intercept (không tự ký URL). Không caption → im lặng. VI bị anti-bot → nhãn trạng thái, không vỡ. KHÔNG làm click-từ/settings (F08).

### Quyết định kiến trúc (đã chốt — KHÔNG đổi, xung đột → escalate):
- **`yt-intercept.ts` = MAIN world, `run_at:document_start`** (hook fetch/XHR trước khi player gọi). **`youtube.ts` = ISOLATED, document_idle** (overlay). Đăng ký 2 content_script riêng trong manifest (`"world":"MAIN"` cho intercept).
- **Không tự tạo URL timedtext** — chỉ dùng baseUrl player đã gọi (+ `tlang=vi`, `fmt=json3`). (SSRF/anti-bot: chỉ đổi query trên host youtube của chính request đó.)
- **Anti-bot VI:** nếu response VI là trang Google "Sorry/automated queries" (không phải json3) → **retry 1 lần**, vẫn fail → trạng thái `blocked`, chỉ hiện dòng DE. Không loop.
- **Chọn cue theo max-start:** cue hiện = cue có `start` lớn nhất thỏa `start ≤ t < start+dur`. Khoảng trống → ẩn overlay.
- **Ẩn caption gốc YouTube** bằng CSS (không xoá DOM của player).
- **Không throw:** mọi lỗi (no caption, parse fail, mạng) → overlay im lặng/nhãn, KHÔNG exception nổi lên.

## Files (tạo/sửa — chỉ scope F07)
| File | Việc |
|---|---|
| `extension/src/lib/captions.ts` | **MỚI, pure (test được):** `parseJson3(text)` → `Cue[] {start,dur,text}`; `pickCue(cues, t)` (max-start); `isAntiBot(text)` (phát hiện "Sorry"/"automated queries"/không phải json3); `buildUrl(baseUrl, {tlang?})` (thêm fmt=json3 + tlang). |
| `extension/src/content/yt-intercept.ts` | **MỚI, MAIN world, document_start:** patch `window.fetch` + `XMLHttpRequest.open/send` để bắt URL chứa `/api/timedtext`. Khi bắt được: fetch DE (json3) + VI (tlang=vi), parse, `postMessage({source:'DL', type:'CAPTIONS', de, vi, viStatus})` sang ISOLATED. Anti-bot VI → retry 1 lần → status. Chỉ patch, KHÔNG chặn request gốc của player (gọi qua rồi trả nguyên). |
| `extension/src/content/youtube.ts` | **THAY stub, ISOLATED:** nghe `window.message` (DL/CAPTIONS); tạo overlay 2 dòng trong `#movie_player`; mỗi `requestAnimationFrame`/`timeupdate` đọc `video.currentTime`, `pickCue` DE+VI, cập nhật text; ẩn khi trống; ẩn caption gốc (`.ytp-caption-window-container{display:none}` qua injected style). Cleanup khi đổi video (SPA nav). |
| `extension/manifest.json` | thêm content_script `yt-intercept.js` (`world:"MAIN"`, `run_at:"document_start"`, match youtube). Giữ `youtube.js` (ISOLATED, document_idle). |
| `extension/build.mjs` | thêm entry `yt-intercept`. |

> KHÔNG làm click-từ, lookup AI, settings, loa (F08). KHÔNG động web/API/service-worker.

## Specifications
- **Intercept:** patch cả `fetch` và `XHR` (player có thể dùng một trong hai). Nhận diện URL: chứa `/api/timedtext`. Lấy `baseUrl` = URL đó (đã có chữ ký). Fetch DE = `buildUrl(baseUrl)` (đảm bảo `fmt=json3`); VI = `buildUrl(baseUrl,{tlang:'vi'})`. Dùng `fetch` (credentials same-origin) trong MAIN world (cùng origin youtube → không CORS).
- **json3 shape:** `{events:[{tStartMs,dDurationMs,segs:[{utf8}]}]}`. `text` = nối `segs[].utf8`, bỏ event rỗng/`\n`. `start=tStartMs/1000`, `dur=dDurationMs/1000`.
- **postMessage contract:** `{source:'DL', type:'CAPTIONS', de:Cue[], vi:Cue[]|null, viStatus:'ok'|'blocked'|'empty'}`. ISOLATED chỉ nhận message có `source==='DL'` (bỏ qua message khác — bảo mật).
- **Overlay:** 2 dòng, DE trên (đậm hơn) + VI dưới, canh giữa dưới khung video, nền đen mờ để dễ đọc. Cập nhật theo currentTime. VI `blocked`/`null` → chỉ hiện DE (+ nhãn nhỏ "VI tạm chặn" tùy chọn). Không cue → ẩn.
- **SPA nav:** YouTube đổi video không reload trang → intercept bắt caption mới; youtube.ts reset cue khi nhận CAPTIONS mới.

## Acceptance Criteria (Gherkin — testable)
```gherkin
# --- Logic tách được (Builder tự test, KHÔNG cần YouTube) ---
Scenario: parseJson3
  Given chuỗi json3 mẫu có 3 events (segs utf8)
  When parseJson3(text)
  Then trả 3 Cue {start,dur,text} đúng giá trị; event rỗng bị bỏ

Scenario: pickCue max-start
  Given cues [{start:0,dur:2},{start:2,dur:2},{start:5,dur:2}]
  When pickCue(cues, 3.0)  Then trả cue start=2
  When pickCue(cues, 4.5)  Then trả null (khoảng trống)
  When pickCue(cues, 6.0)  Then trả cue start=5

Scenario: isAntiBot
  Given response là trang HTML "Sorry... automated queries"
  When isAntiBot(text)  Then true
  Given response json3 hợp lệ
  When isAntiBot(text)  Then false

Scenario: buildUrl
  When buildUrl("https://youtube.com/api/timedtext?x=1&signature=abc", {tlang:'vi'})
  Then giữ signature=abc, có fmt=json3 và tlang=vi

Scenario: Build sạch + typecheck
  When node build.mjs --prod và npm run typecheck -w extension
  Then dist có yt-intercept.js + youtube.js; typecheck xanh; ./init.sh extension 0 secret

# --- Runtime thật (CHỜ HOMEOWNER — mở YouTube video Đức) ---
Scenario: Overlay đồng bộ (Homeowner)
  Given 1 video YouTube tiếng Đức có phụ đề Đức
  When mở video với extension
  Then hiện 2 dòng Đức+Việt, đổi theo currentTime, ẩn khi im lặng

Scenario: No caption im lặng (Homeowner)
  Given video KHÔNG có phụ đề Đức
  Then overlay không hiện gì, console không lỗi

Scenario: VI anti-bot (Homeowner)
  Given VI bị chặn
  Then chỉ hiện DE + nhãn trạng thái, không vỡ
```

## Constraints
- **Stay in scope:** chỉ intercept + overlay. KHÔNG click-từ/lookup/settings/loa (F08), KHÔNG động web/API/SW/auth.
- **Không tự dựng URL timedtext** (chỉ baseUrl đã ký + tlang/fmt). Không fetch host lạ.
- **MAIN world chỉ patch fetch/XHR** để quan sát + refetch — KHÔNG chặn/sửa request gốc của player.
- **ISOLATED chỉ nhận message `source:'DL'`** (không tin message ngoài).
- **Không throw:** lỗi → im lặng/nhãn. **Không thêm dep.** Ẩn caption gốc bằng CSS (không phá DOM player).
- Secret vẫn 0 (F07 không đụng key, nhưng `./init.sh extension` vẫn phải 0 secret).

## Cách verify (Builder tự chạy)
1. **Unit-test pure fn** `captions.ts` (parseJson3/pickCue/isAntiBot/buildUrl) bằng node — dán kết quả (đây là phần chứng minh logic chính).
2. `node build.mjs --prod` + `npm run typecheck -w extension` + `./init.sh extension` (0 secret).
3. Kiểm manifest: yt-intercept có `world:"MAIN"` + `document_start`; youtube.js ISOLATED.
4. **Runtime overlay + anti-bot + no-caption:** ĐÁNH DẤU RÕ "chờ Homeowner" (cần mở YouTube video Đức thật — không mô phỏng được). Ghi hướng dẫn Homeowner test: load unpacked → mở 1 video Đức có phụ đề → xác nhận 2 dòng đồng bộ.

## VERIFY của Chủ thầu (sau khi báo done)
`adversarial-verify` criteria = 4 scenario logic + build/secret + securityChecks = ["ISOLATED chỉ nhận source:'DL'", "không tự dựng URL timedtext (chỉ baseUrl+tlang/fmt)", "MAIN không chặn request gốc", "không throw khi no-caption/parse fail", "dist 0 secret", "manifest world:MAIN đúng, không quyền thừa"]. Runtime overlay defer Homeowner (ghi rõ, không tính là fail).

## Report Format (Builder điền)
```
STATUS: DONE / PARTIAL / BLOCKED
FILES CHANGED:
TEST RESULTS:  (unit-test captions.ts + build/typecheck/secret; runtime overlay = "chờ Homeowner")
ISSUES DISCOVERED:
DEVIATIONS FROM SPEC:
SUGGESTIONS FOR CHỦ THẦU:
```
