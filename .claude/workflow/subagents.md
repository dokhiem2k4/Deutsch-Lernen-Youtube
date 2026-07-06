# Subagents — multi-agent playbook (lấp gap "parallel orchestration")

Claude Code có `Agent` (subagent, fresh context) + `Workflow` (script điều phối deterministic, có
`isolation:'worktree'` cho builders song song). Đây là cách app này dùng chúng.

## Opt-in & cost
- `Workflow` **chỉ chạy khi Homeowner opt-in** (đã opt-in cho project này khi yêu cầu "phần subagent").
- Mỗi lần fan-out tốn token đáng kể → chỉ dùng khi có giá trị (verify feature nặng, review diff lớn, build nhiều leaf độc lập). Việc vặt → làm inline, đừng gọi Workflow.

## 3 pattern (theo multi-agent-pattern)
| Pattern | Context | Dùng cho | Ràng buộc |
|---|---|---|---|
| **Coordinator** | Worker fresh (zero inherit) | verify/review/research nhiều pha | An toàn nhất; prompt phải self-contained |
| **Fork/worktree** | Worktree riêng | build leaf độc lập song song | **1 cấp** — worker không fork tiếp; coordinator merge |
| **Swarm** | Task list chung | (không dùng ở MVP) | — |

**Luật vàng:** coordinator **tổng hợp rồi mới giao**, không "based on your findings". Mỗi worker: prompt tự chứa + tool tối thiểu (`Explore` cho verify/read, `general-purpose` cho build).

## Saved workflows (gọi bằng tên)

### 1. `adversarial-verify` — VERIFY step 7 (thay self-review một chiều)
Coordinator đọc `feature_list.json`, lấy `done_when` của feature đang verify + security check áp dụng, rồi:
```
Workflow({ name:'adversarial-verify', args:{
  featureId:'F04',
  criteria:[ "moi route bao ve -> 401 khi thieu token", "vocabulary POST trung -> tra dong cu khong loi", ... ],
  securityChecks:[ "CORS khong dung *", "OPENAI key khong lo trong client", "prompt-injection schema-locked" ],
  context:'optional extra note'
}})
```
- Mỗi criterion → 1 skeptic (Explore) *cố refute* bằng cách đọc repo thật → nghi ngờ mặc định.
- Alleged failure → 1 judge độc lập reproduce lại. Chỉ `confirmed` khi judge xác nhận.
- Trả `confirmedFailures[]`. **≥1 confirmed → feature chưa done**, quay lại BUILD.

### 2. `parallel-review` — SHIP gate / review diff (thay Codex second-opinion)
```
Workflow({ name:'parallel-review' })   // không cần args; subagent tự chạy git diff
```
- 6 lens song song: correctness, authz-rls, secret-leak, prompt-injection, cors-config, devex.
- Mỗi finding → verify đối kháng (Explore) mới sống. Trả `confirmed[]` sort theo P0→P2.
- **Có P0 confirmed → không SHIP.**

### 3. `parallel-build` — BUILD leaf độc lập (fork/worktree)
Chỉ cho sub-task **thực sự độc lập** (vd F05: 4 trang tu-vung/flashcard/quiz/dashboard; F04: các route tách biệt).
```
Workflow({ name:'parallel-build', args:{ featureId:'F05', tasks:[
  { id:'tu-vung',  spec:'...', files:['web/app/tu-vung/page.tsx'] },
  { id:'flashcard',spec:'...', files:['web/app/hoc-tu-vung/page.tsx'] },
  { id:'quiz',     spec:'...', files:['web/components/QuizGame.tsx','web/app/kiem-tra-duc-viet/page.tsx'] },
  { id:'dashboard',spec:'...', files:['web/app/dashboard/page.tsx'] }
]}})
```
- Mỗi builder chạy trong **worktree riêng** (`isolation:'worktree'`) → không đụng file nhau.
- **Coordinator phải review + merge** các worktree sau đó, rồi chạy `parallel-review` + `init.sh`.
- KHÔNG dùng cho task có phụ thuộc chung (shared lib/schema) — làm tuần tự.

## Feature nào nên fan-out (gợi ý)
- **F04** (API core) → `adversarial-verify` sau khi build (401/idempotent/cache/CORS/prompt-injection nhiều mặt).
- **F05** (4 trang web) → `parallel-build` (độc lập) rồi `parallel-review`.
- **F02** (RLS) → `adversarial-verify` với securityChecks cross-user.
- **F08** (click-word) → `adversarial-verify` (prompt-injection + secret grep) — nhưng verify cuối vẫn cần Homeowner chạy video thật.
- **F09** (ship) → `parallel-review` toàn bộ diff.

## Gotchas
- Workflow script **không đọc được filesystem** → truyền `criteria`/`tasks` qua `args`; subagent bên trong mới đọc repo.
- Worker coordinator-pattern **không thấy context của bạn** → prompt phải tự chứa.
- Fork/worktree **1 cấp**: builder không được spawn builder.
- Kết quả subagent là *đầu vào để bạn tổng hợp*, không phải quyết định cuối — bạn (Builder chính) vẫn cập nhật state + bằng chứng vào `progress.md`.
