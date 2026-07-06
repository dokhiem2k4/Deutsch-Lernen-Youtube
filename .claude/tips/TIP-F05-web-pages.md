# TIP-F05 — Web pages (tu-vung + flashcard + quiz 2 chiều + dashboard)

> **Từ:** Chủ thầu (Contractor) · **Cho:** Thợ thi công (Builder) · **Ngày:** 2026-07-06

## Header
- **Feature ID:** F05 · **Dependencies:** F03 (auth, apiClient, AuthGuard), F04 (API core) — đều DONE
- **Priority:** P0 (feature web cuối trước khi sang extension) · **Effort:** L (~1–1.5 ngày)
- **Blueprint:** §1 (IN scope web), §7 (UI) · **Security:** `.claude/workflow/security.md` (A01 — dữ liệu qua API đã RLS; A03 render as text)

## Context
- **Working dir:** `web/`
- **TÁI DÙNG (không viết lại):**
  - `lib/apiClient.ts` → `apiFetch(path, init)` (tự gắn Bearer JWT). **Mọi gọi API qua đây.**
  - `components/AuthGuard.tsx` → bọc mọi trang cần login.
  - `hooks/useUser.ts`, `lib/supabaseClient.ts` (signOut).
- **API sẵn (F04, đều cần Bearer, apiClient lo):**
  - `GET /api/vocabulary` → `[{id, word, lemma, article, meaning_vi, example, learned_at, created_at}]` (newest-first).
  - `DELETE /api/vocabulary?id=<uuid>` → `{ok:true}`.
  - `POST /api/vocabulary/mark-learned` body `{ids:string[]}` → `{ok:true}`.
  - `GET /api/dashboard` → `{total_learned, total_words, streak, today_active, chart:[{date,count}]}` (chart 30 ngày).
- **Chưa có:** trang thật (chỉ `/dashboard` placeholder từ F03 — **thay bằng bản thật**), `Header`, `QuizGame`, `ui/*`.

## Task
Dựng 4 trang học tập + component dùng chung, tất cả bọc `AuthGuard`, gọi API F04 qua `apiClient`. Tiếng Việt toàn bộ UI. Tối giản, Tailwind v4.

### Quyết định kiến trúc (đã chốt — KHÔNG đổi, xung đột → escalate):
- **Không thêm lib UI ngoài** (không shadcn/MUI). Tự viết `ui/*` tối giản bằng Tailwind.
- **Article tô màu theo giống** (điểm nhấn UX): `der` = xanh dương, `die` = hồng/đỏ, `das` = xanh lá, null = xám. Gom vào 1 helper `lib/article.ts` (`articleColor(article)`).
- **Quiz distractor** = 3 từ SAI lấy **random từ chính vocab của user** (không gọi AI). `<4 từ` → chặn, thông báo "Cần ≥4 từ để làm quiz".
- **Flashcard mark-learned:** khi user **lật xem mặt sau** một thẻ (hoặc bấm "Đã hiểu") → gom id → gọi `mark-learned` (batch, cuối phiên hoặc mỗi thẻ; chọn mỗi-thẻ cho đơn giản, idempotent nên an toàn).
- **Render mọi field từ API as text** (không dangerouslySetInnerHTML) — meaning/example là dữ liệu.

## Files (tạo/sửa — chỉ scope F05)
### Tầng SHARED (làm trước — các trang phụ thuộc)
| File | Việc |
|---|---|
| `web/lib/article.ts` | `articleColor(article)` → class Tailwind theo giống; `articleLabel`. |
| `web/components/ui/Button.tsx` | button tối giản (variant primary/ghost/danger). |
| `web/components/ui/Card.tsx` | card wrapper. |
| `web/components/ui/Badge.tsx` | badge trạng thái (Từ mới / Đã học). |
| `web/components/ui/Spinner.tsx` | loading. |
| `web/components/Header.tsx` | nav: "Tiến độ học" (/dashboard), "Từ vựng" (/tu-vung), "Học" (/hoc-tu-vung), "Kiểm tra" (menu 2 chiều); avatar/email + Đăng xuất. |

### Tầng TRANG (độc lập nhau — ứng viên parallel-build)
| File | Việc |
|---|---|
| `web/app/tu-vung/page.tsx` | List từ (word + article tô màu + meaning + example + Badge trạng thái); nút Xoá từng từ (DELETE → optimistic/refetch); link sang Flashcard/Quiz. Empty state. |
| `web/app/hoc-tu-vung/page.tsx` | Flashcard: mặt trước (word + article to + loa `speechSynthesis` de-DE), mặt sau (meaning_vi + example); Trước/Sau, tiến độ (3/20); lật xem → `mark-learned([id])`. <1 từ → thông báo. |
| `web/components/QuizGame.tsx` | Component dùng chung, prop `direction: "de-vi" | "vi-de"`. 4 đáp án (1 đúng + 3 distractor random từ vocab), chấm điểm, next câu, kết quả cuối. <4 từ → chặn + thông báo. |
| `web/app/kiem-tra-duc-viet/page.tsx` | `<QuizGame direction="de-vi" />` (hỏi từ Đức → chọn nghĩa Việt) bọc AuthGuard+Header. |
| `web/app/kiem-tra-viet-duc/page.tsx` | `<QuizGame direction="vi-de" />` (hỏi nghĩa Việt → chọn từ Đức). |
| `web/app/dashboard/page.tsx` | **THAY placeholder:** streak (số ngày + "hôm nay đã học?"), tổng từ đã học / tổng từ, biểu đồ 30 ngày (`chart`) — vẽ bằng div/SVG thuần (KHÔNG thêm lib chart). |

> Mọi trang: `<AuthGuard><Header/>…</AuthGuard>`. Dùng `apiFetch`. Loading → Spinner; lỗi mạng → thông báo nhẹ, không vỡ.

## Specifications
- **/tu-vung:** load `GET /api/vocabulary`. Mỗi item: article tô màu theo `articleColor`. Badge: `learned_at` null → "Từ mới" (xám/xanh), else "Đã học" (xanh lá). Xoá → `DELETE ?id=` → cập nhật list. Rỗng → "Chưa có từ nào, hãy lưu từ trên YouTube".
- **/hoc-tu-vung:** dùng toàn bộ vocab. Flashcard lật (state `flipped`). Loa: `new SpeechSynthesisUtterance(word)`, `lang="de-DE"`, `speechSynthesis.speak`. Lật sang mặt sau lần đầu của thẻ chưa học → gọi `mark-learned([id])` (idempotent). Hết bộ → "Xong! Ôn lại / Về từ vựng".
- **QuizGame:** nhận vocab (tự fetch hoặc prop). `<4 từ` → render thông báo chặn. Mỗi câu: chọn 1 từ đúng + 3 từ khác random (distractor). `direction="de-vi"`: đề = `word`(+article), đáp án = `meaning_vi`. `vi-de`: đề = `meaning_vi`, đáp án = `word`. Chọn đúng/sai → phản hồi màu, +điểm. Hết → điểm số + "Làm lại".
- **/dashboard:** load `GET /api/dashboard`. Hiển thị: streak lớn ("🔥 N ngày"), today_active → dấu tích/nhắc học; total_learned / total_words; biểu đồ cột 30 ngày từ `chart` (cao theo count, tooltip ngày). Rỗng/0 → vẫn hiển thị khung, không vỡ.

## Acceptance Criteria (Gherkin — testable)
```gherkin
Scenario: Route bảo vệ
  Given chưa login
  When mở /tu-vung | /hoc-tu-vung | /kiem-tra-duc-viet | /kiem-tra-viet-duc | /dashboard
  Then bị AuthGuard chuyển về "/"

Scenario: Từ vựng hiển thị + xoá
  Given user có ≥1 từ
  When mở /tu-vung
  Then thấy word + article tô màu theo giống + meaning + Badge trạng thái
  When bấm Xoá 1 từ
  Then gọi DELETE /api/vocabulary?id=, từ biến mất khỏi list

Scenario: Flashcard mark-learned
  Given có từ chưa học
  When lật thẻ xem mặt sau
  Then gọi POST /api/vocabulary/mark-learned {ids:[id]} (từ chuyển "Đã học")

Scenario: Quiz chặn khi thiếu từ
  Given user có <4 từ
  When mở /kiem-tra-duc-viet
  Then hiện thông báo "cần ≥4 từ", KHÔNG render câu hỏi

Scenario: Quiz 4 đáp án 1 đúng
  Given user có ≥4 từ
  When làm /kiem-tra-duc-viet
  Then mỗi câu 4 đáp án (1 đúng + 3 distractor từ vocab), chọn được, có chấm điểm

Scenario: Dashboard
  When mở /dashboard
  Then thấy streak, total_learned/total_words, biểu đồ 30 ngày (từ /api/dashboard)

Scenario: Chất lượng
  When ./init.sh web
  Then lint + typecheck + build xanh
```

## Constraints
- **Stay in scope:** chỉ 4 trang + component/ui/lib nêu trên. KHÔNG động API (F04), KHÔNG extension (F06), KHÔNG đổi schema.
- **Reuse bắt buộc:** `apiFetch` (mọi call), `AuthGuard`, `articleColor`. KHÔNG gọi supabase trực tiếp từ trang (trừ signOut trong Header).
- **Không thêm dep** (chart/UI lib). Biểu đồ = div/SVG thuần.
- **Render as text** (không innerHTML). Không log token.
- **Không vỡ UI:** lỗi API → thông báo nhẹ + Spinner, không throw/trang trắng.

## Cách verify (Builder tự chạy)
1. `./init.sh web` all green (dán output).
2. **AuthGuard:** mở 5 route khi chưa login (localStorage trống) → redirect "/". (curl chỉ thấy HTML shell — kiểm bằng logic/build; nếu chạy browser được thì tốt hơn.)
3. **Path có dữ liệu** (list/flashcard/quiz/dashboard): tạo user test + seed vài từ qua service_role/API (như F04), lấy token, thao tác thật hoặc mô tả. Đánh dấu phần cần Homeowner (login Google thật) nếu không tự chạy được browser.
4. Quiz <4 từ vs ≥4 từ: test cả 2 nhánh (seed 3 từ rồi 5 từ).

## VERIFY của Chủ thầu (sau khi báo done)
`adversarial-verify` criteria = các Scenario + securityChecks = ["mọi trang bọc AuthGuard (chưa login → /)", "gọi API qua apiFetch có Bearer, không lộ token", "render field API as text, không innerHTML", "không thêm dep ngoài"]. Có thể `parallel-build` cho 4 trang leaf sau khi tầng shared xong.

## Report Format (Builder điền)
```
STATUS: DONE / PARTIAL / BLOCKED
FILES CHANGED:
TEST RESULTS:  (đánh dấu "chờ Homeowner" cho phần cần login Google/browser thật)
ISSUES DISCOVERED:
DEVIATIONS FROM SPEC:
SUGGESTIONS FOR CHỦ THẦU:
```
