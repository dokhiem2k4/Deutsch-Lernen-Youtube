export const meta = {
  name: 'parallel-review',
  description: 'Multi-lens review of the current git diff (correctness, RLS/authz, secret-leak, prompt-injection, CORS, DevEx); every finding adversarially verified before it survives.',
  phases: [
    { title: 'Review', detail: 'one reviewer per lens over the diff' },
    { title: 'Verify', detail: 'refute each finding in the repo' },
  ],
}

// Reviews the CURRENT diff. No args needed; subagents run `git diff` themselves.
const LENSES = [
  { key: 'correctness', focus: 'Logic bugs, wrong states, unhandled errors, non-idempotent vocabulary (UNIQUE user_id,word), fallback that throws/500 instead of degrading.' },
  { key: 'authz-rls', focus: 'Every /api except /api/health returns 401 without a valid JWT; RLS enforced by auth.uid(); no cross-user leakage; service_role never reachable from client.' },
  { key: 'secret-leak', focus: 'No service_role or OPENAI key in extension bundle/client code; secrets only read via process.env inside Route Handlers.' },
  { key: 'prompt-injection', focus: 'lookup-context treats subtitle word/sentence as untrusted; response_format json_object schema-locked; output validated (article in der/die/das/null); no raw model output executed or injected as HTML.' },
  { key: 'cors-config', focus: 'CORS reflects the web origin + chrome-extension://, never *; only the Authorization header is allowed.' },
  { key: 'devex', focus: 'Time-to-hello-world: README and .env.example complete, error messages clear, no hidden manual steps.' },
]

const FINDINGS = {
  type: 'object', additionalProperties: false,
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['P0', 'P1', 'P2'] },
          detail: { type: 'string' },
        },
        required: ['title', 'file', 'severity', 'detail'],
      },
    },
  },
  required: ['findings'],
}
const VERDICT = {
  type: 'object', additionalProperties: false,
  properties: { isReal: { type: 'boolean' }, reason: { type: 'string' } },
  required: ['isReal', 'reason'],
}

const results = await pipeline(
  LENSES,
  (l) => agent(
    `Review the CURRENT git diff (run \`git diff\` and \`git diff --staged\`) of "Deutsch Lernen" ` +
    `through the ${l.key} lens.\nFocus: ${l.focus}\n` +
    `Return only real findings with file + severity (P0 blocks ship). If clean, return empty findings.`,
    { label: `review:${l.key}`, phase: 'Review', schema: FINDINGS, agentType: 'general-purpose' }
  ),
  (review) => parallel(((review && review.findings) || []).map((f) => () =>
    agent(
      `Adversarially verify this finding in the actual repo. Is it REAL and reproducible?\n` +
      `Title: ${f.title}\nFile: ${f.file}:${f.line || '?'}\nSeverity: ${f.severity}\nDetail: ${f.detail}\n` +
      `Inspect the code yourself. Default isReal=false unless you can concretely confirm it.`,
      { label: `verify:${f.file}`, phase: 'Verify', schema: VERDICT, agentType: 'Explore' }
    ).then((v) => ({ ...f, verdict: v }))
  ))
)

const order = { P0: 0, P1: 1, P2: 2 }
const confirmed = results.flat().filter(Boolean)
  .filter((f) => f.verdict && f.verdict.isReal)
  .sort((a, b) => order[a.severity] - order[b.severity])
log(`Confirmed ${confirmed.length} finding(s); ${confirmed.filter((f) => f.severity === 'P0').length} P0.`)
return { confirmed }
