import { createClient } from "@supabase/supabase-js";

// Browser client — session lưu localStorage (default storageKey `sb-<ref>-auth-token`)
// để extension auth-bridge (F06) đọc được. PKCE + detectSessionInUrl cho OAuth.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
