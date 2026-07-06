# Deutsch Lernen — Agent Harness

Người Việt học tiếng Đức qua YouTube (phụ đề Đức–Việt + click-tra-từ AI + ôn flashcard/quiz).
Full-stack **Next.js 15** + **Supabase** + **Chrome MV3 extension**. Monorepo npm workspaces.

## Source of truth
- **Blueprint (đã duyệt):** `docs/superpowers/specs/2026-07-05-deutsch-lernen-mvp-design.md` — kiến trúc, data model, API, luồng. KHÔNG đổi kiến trúc mà không quay lại VISION.
- **State:** `feature_list.json` (feature nào đang làm, done chưa) + `progress.md`.
- **Workflow mở rộng:** `.claude/workflow/pipeline.md` (8 bước vibecode-kit + SHIP/MONITOR/adversarial-verify/DevEx/docs).
- **Security gate:** `.claude/workflow/security.md` (CSO — STRIDE + OWASP theo stack này).

## Startup Workflow (mỗi phiên — before writing code)
1. Đọc `progress.md` + `session-handoff.md` → biết đang ở đâu.
2. Đọc `feature_list.json` → lấy `active_feature`, đọc `done_when` + `verify`.
3. Đọc mục tương ứng trong Blueprint trước khi code.
4. **One feature at a time** (làm 1 feature một lúc). Xong → chạy verify → cập nhật state → SHIP gate.

## Verification Commands
- `./init.sh scaffold` | `web` | `extension` | `secret` | `all` — lint/typecheck/build/test + secret-leak grep.
- Feature chỉ `done` khi lệnh verify liên quan **all green**; dán output làm bằng chứng vào `progress.md`.

## Subagents (multi-agent — opt-in)
Điều phối song song qua `Workflow` (saved trong `.claude/workflows/`) — chi tiết `.claude/workflow/subagents.md`:
- **`adversarial-verify`** — VERIFY: fan-out skeptic refute từng `done_when` + judge. Dùng cho F02/F04/F08.
- **`parallel-review`** — SHIP gate: 6 lens review diff (correctness/RLS/secret/prompt-injection/CORS/DevEx), verify đối kháng. 0 P0 mới ship.
- **`parallel-build`** — build leaf độc lập trong worktree riêng (vd F05 4 trang), coordinator review+merge.
Tốn token → chỉ fan-out khi đáng; việc vặt làm inline. Kết quả subagent là input để bạn tổng hợp, không phải quyết định cuối.

## Standard feature loop (chuẩn — Homeowner chốt 2026-07-06)
`Chủ thầu viết TIP (.claude/tips/) → Thợ làm + Report → VERIFY + SECURITY → SMOKE TEST → (pass) → tự commit atomic + push origin/main`
- **Commit + push `main` là ĐƯỢC PHÉP tự động** sau khi smoke test pass (standing approval) — không hỏi lại từng feature.
- **Deploy:** hoãn (chưa setup Vercel). Extension = build artifact, không deploy server.
- Force-push / reset --hard / DROP / rm -rf → vẫn `/careful` (dừng hỏi). Chi tiết: `.claude/workflow/pipeline.md`.

## Roles (vibecode-kit)
- **Homeowner (bạn):** quyết định chiến lược, setup Supabase/OAuth/OpenAI keys, verify thật.
- **Contractor:** design/QC/orchestrate — KHÔNG code.
- **Builder (agent này):** implement đúng feature spec, self-test, report. **Stay in scope** — KHÔNG tự đổi kiến trúc/thêm feature ngoài spec. Xung đột → escalate, không tự quyết.

## Invariants — không được vi phạm (guardrails)
- **Secrets chỉ ở server.** `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` chỉ đọc trong Route Handler. Extension chỉ chứa anon key + URL. **`init.sh` grep dist extension phải 0 secret** — feature không done nếu grep dơ.
- **RLS mọi bảng user-data:** policy = `auth.uid()`. Không bao giờ trả dữ liệu user khác.
- **Auth:** mọi `/api` (trừ `/api/health`) → 401 nếu thiếu/sai JWT. Verify qua `supabase.auth.getUser(jwt)`.
- **CORS:** phản chiếu origin web + `chrome-extension://`, **không bao giờ `*`**.
- **AI input là untrusted:** text phụ đề đưa vào `/api/lookup-context` phải coi như dữ liệu, ép output JSON schema, không execute. Xem `security.md`.
- **Không vỡ UI:** lỗi AI/mạng/caption → fallback im lặng, không throw/500.
- **`/careful`:** trước lệnh phá hủy (rm -rf, DROP, force-push, reset --hard) → dừng, hỏi Homeowner.
- **`/freeze`:** khi debug 1 feature, chỉ sửa file trong scope của feature đó.

## Definition of Done (mỗi feature)
- `done` = lint + typecheck + build + test **pass** (chạy được qua `init.sh` cho phần liên quan).
- `secured` = qua checklist `security.md` áp dụng.
- `verified` = Homeowner chạy qua flow thật (xem §9 Blueprint).
- Không đánh dấu done nếu chưa có **bằng chứng** (log/test output). Ghi bằng chứng vào `progress.md`.

## Escalation
- L1 (tên biến, code style): Builder tự quyết.
- L2 (spec mơ hồ, chọn pattern, trade-off): dừng, hỏi trong report.
- L3 (đổi scope/kiến trúc/business rule/security): STOP → Homeowner.

## End of Session (before ending — clean, restartable)
1. Cập nhật `feature_list.json` status + `progress.md` (Current State + bằng chứng).
2. Cập nhật `session-handoff.md`: Blockers, Files touched, Recommended Next Step.
3. Ghi bài học vào harness memory. **Next steps** phải rõ để phiên sau resume sạch.

## Memory
Ghi quyết định/bài học không suy ra được từ code vào harness memory:
`C:\Users\ADMIN\.claude\projects\D--dev-Deutsch-Lernen-Youtube\memory\` (index ở `MEMORY.md`).
