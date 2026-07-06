import { getUserFromRequest } from "@/lib/supabaseServer";
import { corsHeaders } from "@/lib/cors";

// GET /api/me — Bearer JWT. Thiếu/sai token → 401. Hợp lệ → { id, email, nickname }.
export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function GET(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) {
      return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });
    }

    const { user, supabase } = auth;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, nickname")
      .eq("id", user.id)
      .maybeSingle();

    return Response.json(
      profile ?? { id: user.id, email: user.email ?? null, nickname: null },
      { status: 200, headers: cors }
    );
  } catch {
    return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
  }
}
