import { SUPABASE_URL, ANON_KEY } from "./env";

// Key mà background lưu session (chrome.storage.local).
export const SESSION_STORAGE_KEY = "sm_session";

// Session Supabase mà extension cần (không dùng supabase-js — tránh dep nặng).
export type ExtSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user?: { id: string; email?: string | null };
};

// Ref project lấy từ hostname URL → key localStorage web: sb-<ref>-auth-token.
function projectRef(): string {
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0];
  } catch {
    return "";
  }
}
export const STORAGE_KEY = `sb-${projectRef()}-auth-token`;

function pickSession(s: unknown): ExtSession | null {
  if (!s || typeof s !== "object") return null;
  const o = s as Record<string, unknown>;
  if (typeof o.access_token !== "string" || typeof o.refresh_token !== "string") return null;
  const u = o.user as Record<string, unknown> | undefined;
  return {
    access_token: o.access_token,
    refresh_token: o.refresh_token,
    expires_at: typeof o.expires_at === "number" ? o.expires_at : undefined,
    user:
      u && typeof u.id === "string"
        ? { id: u.id, email: typeof u.email === "string" ? u.email : null }
        : undefined,
  };
}

// Supabase lưu session dạng JSON (đôi khi bọc { currentSession }). Parse an toàn → null nếu hỏng.
export function parseSession(raw: string | null): ExtSession | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return pickSession(o.currentSession ?? o);
  } catch {
    return null;
  }
}

// Refresh access_token qua REST (grant_type=refresh_token, anon apikey). Không throw → null nếu fail.
export async function refreshSession(refresh_token: string): Promise<ExtSession | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ refresh_token }),
    });
    if (!res.ok) return null;
    return pickSession(await res.json());
  } catch {
    return null;
  }
}
