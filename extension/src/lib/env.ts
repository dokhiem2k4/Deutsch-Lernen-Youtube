// CHỈ giá trị PUBLIC (anon key + URL). Inject lúc build qua process.env.EXT_* (build.mjs define).
// TUYỆT ĐỐI không đưa khoá riêng tư (service-role, OpenAI) vào extension.
// `process` chỉ là placeholder cho esbuild define (thay bằng string literal lúc build) —
// khai báo type-only để tsc không cần @types/node.
declare const process: { env: Record<string, string | undefined> };

export const SUPABASE_URL = process.env.EXT_SUPABASE_URL || "";
export const ANON_KEY = process.env.EXT_SUPABASE_ANON_KEY || "";
export const APP_URL = process.env.EXT_APP_URL || "http://localhost:3000";
