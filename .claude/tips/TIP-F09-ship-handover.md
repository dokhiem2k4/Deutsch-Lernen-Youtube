# TIP-F09 — SHIP tổng + verify tổng + handover

> **Từ:** Chủ thầu (Contractor) · **Cho:** Thợ thi công (Builder) · **Ngày:** 2026-07-06

## Header
- **Feature ID:** F09 · **Dependencies:** F05 + F08 (toàn bộ build) — DONE
- **Priority:** P0 (đóng MVP) · **Effort:** M (chủ yếu docs + gate, ít code)
- **Blueprint:** §9 (kiểm thử & DoD), §10 (setup Homeowner), §11 (thứ tự) · **Security:** `.claude/workflow/security.md` (final pass)

## Context
- **Working dir:** repo root (`web/`, `extension/`, `supabase/`, `docs/`)
- **Trạng thái:** F01–F08 done+verified. OAuth + OPENAI đã bật + verified server-side (Katze→die/mèo source:openai→cache; login authorize 302). Extension build env thật, 0 secret.
- **Còn "verified by Homeowner":** overlay 2 dòng trên video Đức (F07) + UI thẻ click-từ trên Chrome (F08) — không tự động hoá được.
- **README hiện tại** (F01) chỉ mức cơ bản → F09 **nâng lên bản handover đầy đủ**.

## Task
Đóng gói MVP: (1) README + handover **đầy đủ để người mới tự dựng** (Supabase/OAuth/OpenAI/env/migration/run/build/load), (2) **bảng truy vết REQ** Blueprint §1 → feature → trạng thái verify, (3) chạy **SHIP gate** (`./init.sh all` xanh + 0 secret), (4) **MONITOR** (health/advisors/smoke). KHÔNG thêm feature/sửa logic sản phẩm (trừ bug lộ ra lúc verify tổng → REFINE).

### Quyết định (đã chốt):
- **Không đổi kiến trúc/logic** — F09 là docs + gate. Bug phát sinh → fix nhỏ (REFINE), không mở rộng scope.
- **Docs theo Diataxis:** How-to (setup/run/build), Reference (API/env/data model — trỏ Blueprint), Tutorial (luồng học từ đầu-cuối), Explanation (vì sao — trỏ Blueprint §0).
- **Deploy:** vẫn HOÃN (theo workflow chuẩn) — README ghi rõ "chạy local"; mục deploy để "sau".

## Files (tạo/sửa — scope F09)
| File | Việc |
|---|---|
| `README.md` | **NÂNG CẤP:** Overview + cây thư mục; **Prerequisites**; **Setup từng bước** (Supabase project/keys → apply 3 migration → Google OAuth (Google Cloud client + Supabase provider + redirect `https://<ref>.supabase.co/auth/v1/callback` + URL config localhost) → OpenAI key + billing); **Env** (`.env`/`web/.env.local`/`extension` EXT_*, cảnh báo secret server-only); **Run** (`npm run dev` web); **Extension** (`npm run build:ext` với EXT_* → Load unpacked `extension/dist`); **Verify** (`./init.sh all`); **Troubleshooting** (OAuth test-user, OpenAI 429 quota, overlay không hiện, VI anti-bot). |
| `docs/HANDOVER.md` | **MỚI:** kiến trúc tóm tắt (web full-stack + extension + Supabase); **Bảng REQ traceability** (Blueprint §1 IN → feature Fxx → trạng thái: verified server / chờ Homeowner browser); danh sách "verified vs còn lại"; cách chạy lại verify; known limitations (deploy hoãn, IPA bỏ, v.v.); next steps. |
| `progress.md` / `feature_list.json` / `session-handoff.md` | F09 done; ghi kết quả SHIP gate + MONITOR + verification matrix. |

> KHÔNG sửa code sản phẩm trừ khi verify tổng lộ bug (khi đó: fix nhỏ + ghi rõ).

## Specifications
- **README "Setup" phải đủ để TTHW**: người mới clone → theo README → chạy được web login + extension overlay, không cần hỏi. Gồm cả 2 việc Homeowner đã làm (OAuth, OpenAI) viết thành bước tái lập được.
- **REQ traceability** (docs/HANDOVER.md): mỗi mục IN của Blueprint §1 (auth, extension phụ đề, click-từ, settings, popup; web login/tu-vung/hoc-tu-vung/quiz 2 chiều/dashboard) → cột: Feature | Bằng chứng | Verified(server/Homeowner). Không để REQ nào "không map".
- **SHIP gate:** `./init.sh all` (scaffold+web+extension+secret) **all green**; `./init.sh secret` 0 secret. Dán output.
- **MONITOR:** `GET /api/health` → ok; Supabase `get_advisors(security)` → không P0 mới (2 mục INFO/WARN intentional đã biết); (tùy) smoke login+lookup+save như đã chạy.

## Acceptance Criteria (Gherkin)
```gherkin
Scenario: README tái lập được
  Given người mới + repo + tài khoản Supabase/Google/OpenAI
  When làm theo README Setup
  Then dựng được: web login Google chạy, migration applied, extension load unpacked, env đúng — không thiếu bước

Scenario: REQ traceability đầy đủ
  When mở docs/HANDOVER.md bảng REQ
  Then mọi mục IN Blueprint §1 có Feature + Bằng chứng + trạng thái verified; 0 mục bỏ trống

Scenario: SHIP gate xanh
  When ./init.sh all
  Then scaffold+web+extension đều VERIFY OK; secret = 0

Scenario: MONITOR
  When GET /api/health và supabase advisors(security)
  Then health ok; advisors 0 P0 mới (chỉ 2 mục intentional đã ghi)

Scenario: Không hồi quy
  When ./init.sh web + typecheck
  Then vẫn xanh (F09 không phá gì)
```

## Constraints
- **Stay in scope:** docs + gate + verify tổng. KHÔNG thêm feature, KHÔNG đổi logic (trừ bug fix nhỏ có ghi).
- **Secret:** README/handover KHÔNG chứa key thật (chỉ placeholder + đường dẫn lấy). `./init.sh secret` 0.
- **Trung thực:** phần chưa Homeowner verify (overlay/click browser) ghi rõ "chờ Homeowner", KHÔNG ghi "verified".

## Cách verify (Builder tự chạy)
1. `./init.sh all` → dán output (scaffold+web+extension+secret xanh).
2. `GET /api/health` (server chạy) → ok; Supabase advisors(security) → liệt kê, xác nhận chỉ 2 mục intentional.
3. Đọc lại README như "người mới": có bước nào thiếu/mơ hồ? Sửa. Kiểm mọi lệnh copy-paste chạy được.
4. Rà `docs/HANDOVER.md`: mọi REQ §1 có dòng, không trống.

## VERIFY của Chủ thầu (sau khi báo done)
- `adversarial-verify` với criteria = "README đủ bước setup (Supabase/OAuth/OpenAI/migration/run/extension)", "REQ traceability không mục trống", "init.sh all xanh", "0 secret", "không hồi quy F01–F08" + securityChecks = ["docs không chứa secret thật", "init.sh all pass", "advisors 0 P0 mới"].
- Đây là VERIFY TỔNG → có thể kèm rà chéo toàn bộ REQ (không chỉ F09).

## Report Format (Builder điền)
```
STATUS: DONE / PARTIAL / BLOCKED
FILES CHANGED:
TEST RESULTS:  (./init.sh all output + health + advisors + README self-review)
REQ TRACEABILITY: (tóm tắt: N REQ mapped, M verified-server, K chờ-Homeowner)
ISSUES DISCOVERED:
DEVIATIONS FROM SPEC:
SUGGESTIONS FOR CHỦ THẦU:  (gồm: còn gì Homeowner cần làm để "verified" 100%)
```
