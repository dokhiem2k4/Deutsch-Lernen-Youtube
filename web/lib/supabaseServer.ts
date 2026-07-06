import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

// Server-side auth cho Route Handlers — Bearer JWT stateless.
// CHỈ dùng anon key + JWT của caller (RLS tự lọc). KHÔNG dùng service_role ở đây.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function bearerFromRequest(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function supabaseForToken(token: string): SupabaseClient {
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Trả { user, supabase(scoped) } nếu JWT hợp lệ, ngược lại null.
export async function getUserFromRequest(
  req: Request
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const token = bearerFromRequest(req);
  if (!token) return null;
  const supabase = supabaseForToken(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { user: data.user, supabase };
}
