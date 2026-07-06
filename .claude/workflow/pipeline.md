# Pipeline mở rộng — vibecode-kit + gaps (gstack-inspired)

Nền là 8 bước vibecode-kit. Bổ sung các phần vibecode-kit thiếu (đã đối chiếu gstack):
**adversarial VERIFY, SECURITY gate, DevEx review, SHIP, MONITOR, Diataxis docs, guardrails, memory**.

```
SCAN → RRI → VISION → BLUEPRINT ─┐  (ĐÃ XONG — Blueprint duyệt 2026-07-05)
                                  ▼
   BUILD(6) → VERIFY(7) → SECURITY(7.5) → DEVEX(7.6) → REFINE(8) → SHIP(9) → MONITOR(10)
     │guardrails   │adversarial   │STRIDE/OWASP   │TTHW      │        │gate   │post-deploy
```

Với mỗi feature trong `feature_list.json`, đi qua BUILD→...→SHIP rồi mới sang feature kế.

---

## 6. BUILD — với guardrails
- Implement đúng `scope` + `done_when` của feature. KHÔNG thêm ngoài scope. Xung đột spec → escalate L2/L3.
- **Live testing (không chỉ "code xong là xong"):** phần chạy được phải được *chạy thật*.
  - Web/API: `curl`/test route thật (đặc biệt 401 khi thiếu JWT), không chỉ đọc code.
  - Extension: build ra dist thật; luồng phụ đề/click cần Homeowner mở YouTube thật (đánh dấu `verify` chờ Homeowner).
- **`/freeze`:** khi sửa bug, giới hạn sửa trong file thuộc feature đang làm; đừng lan sang feature khác.
- **`/careful`:** lệnh phá hủy (rm -rf, DROP TABLE, force-push, reset --hard, xóa migration) → dừng, xác nhận Homeowner trước.
- **Atomic commit:** mỗi feature/bugfix = 1 commit gọn, message nêu *lý do* + feature id. Bugfix → kèm test tái hiện.

## 7. VERIFY — adversarial (thay cho self-review một chiều)
Sau khi Builder tự test, chạy **kiểm chứng đối kháng** để bắt lỗi self-review bỏ sót:
1. Chạy `init.sh` phần liên quan → lint/typecheck/build/test phải xanh, dán output vào `progress.md`.
2. **Refute pass (subagent):** dùng saved workflow **`adversarial-verify`** — xem `.claude/workflow/subagents.md`.
   Đọc `done_when` của feature trong `feature_list.json`, truyền qua `args.criteria` (+ `securityChecks`).
   Mỗi criterion → 1 skeptic *cố refute* + 1 judge reproduce. **≥1 `confirmedFailures` → chưa done**, quay lại BUILD.
   - Feature nhẹ / không opt-in Workflow → spawn `Agent` (Explore) thủ công theo cùng tinh thần.
3. **Requirement traceability:** mỗi REQ trong Blueprint §1/§4 phải map tới feature. Thiếu → ghi Open Question.

> Cross-model tùy chọn: nếu có Codex/GPT CLI, dùng làm second opinion. Không có thì `parallel-review` (subagent Claude fresh-context) là đủ.

## 7.5 SECURITY gate (CSO)
Chạy checklist `.claude/workflow/security.md` áp dụng cho feature. **Không SHIP nếu còn P0 security hở.**
Bắt buộc cho: F02 (RLS), F03/F04 (authz+CORS+prompt-injection), F06/F08 (secret-in-bundle).

## 7.6 DEVEX review
- **TTHW (time-to-hello-world):** người mới clone → chạy được mất bao lâu? README có đủ bước? `.env.example` đủ biến?
- **Friction map:** lỗi mơ hồ, thiếu script, bước thủ công ẩn → ghi lại, vá nếu rẻ.
- Áp mạnh ở F01 (scaffold) và F09 (handover).

## 8. REFINE
Được: sửa text/màu/nội dung trong section có sẵn, fix issue từ VERIFY/SECURITY.
Không được (phải quay lại VISION): thêm feature, đổi layout lớn, đổi tech stack, thêm module. → Escalate L3.

## ⭐ Standard feature loop (chuẩn — Homeowner chốt 2026-07-06)
```
Chủ thầu viết TIP (.claude/tips/) → Thợ làm + Completion Report
   → VERIFY (adversarial) + SECURITY gate → SMOKE TEST
   → (pass) → TỰ commit atomic vào main + push origin/main
```
- **Auto commit + push là ĐƯỢC PHÉP** (standing approval) sau khi smoke test pass — không cần hỏi lại từng lần.
- **Deploy:** hoãn (chưa setup). Web sẽ deploy Vercel sau; extension = build artifact (publish Chrome Web Store thủ công). Khi bật deploy → thêm vào cuối loop.
- Vẫn giữ `/careful` cho lệnh phá hủy (force-push, reset --hard, rm -rf, DROP) → dừng hỏi.

## 9. SMOKE TEST + SHIP (commit + push main)
**9a. Smoke test** (trước khi commit) — chạy thật, không chỉ build:
- `./init.sh` liên quan **all green** (lint + typecheck + build + test).
- Web/API: curl endpoint chính của feature (đặc biệt 401 khi thiếu JWT, path chính).
- `./init.sh secret` = 0 secret trong client bundle.
- (Feature nặng) `parallel-review` — 0 P0 confirmed trên diff.
- Dán output vào `progress.md`.

**9b. SHIP** (pass smoke → tự động):
- [ ] `feature_list.json` status + `progress.md` bằng chứng đã cập nhật.
- [ ] Docs theo diff (Diataxis: Reference API/env, How-to setup, Tutorial flow, Explanation).
- [ ] **Commit atomic vào `main`**: message nêu `F0x` + REQ đã cover + tóm tắt done_when pass. Kết bằng 2 dòng Co-Authored-By + Claude-Session.
- [ ] **`git push origin main`.**
- Bugfix → kèm test tái hiện. Không gộp nhiều feature vào 1 commit (atomic theo feature).

## 10. MONITOR — post-ship (khi đã bật deploy)
Hiện HOÃN (chưa deploy). Khi có deploy:
- `GET /api/health` → ok sau deploy; smoke flow chính; Supabase advisors sau migration.
- Ghi kết quả vào `progress.md`; hồi quy → mở feature fix mới, không sửa lén.

---

## Checkpoint gates (không bỏ qua)
- **BUILD→VERIFY:** feature status DONE hoặc DEFERRED có lý do; không BLOCKED chưa resolve.
- **VERIFY→SECURITY:** adversarial refute pass; traceability đủ.
- **SECURITY→SHIP:** 0 P0 security; 0 secret trong dist.
- **SHIP→next:** state cập nhật + bằng chứng + docs sync.

## Memory routine (mỗi cuối phiên)
Ghi vào harness memory (`.../memory/`, index `MEMORY.md`) những gì không suy ra được từ code:
quyết định kiến trúc phát sinh, cạm bẫy đã gặp (vd anti-bot YouTube VI, extension-context-invalidated), lựa chọn trade-off. Cập nhật `session-handoff.md` trước khi dừng.
