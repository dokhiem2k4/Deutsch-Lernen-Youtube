import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. service_role bypass RLS — CHỈ import trong Route Handler server.
// Dùng cho ai_meaning_cache (RLS bật, không policy → chỉ service_role, cache dùng chung).
// KHÔNG BAO GIỜ import ở client component / extension. KHÔNG NEXT_PUBLIC_.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function supabaseAdmin(): SupabaseClient {
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
