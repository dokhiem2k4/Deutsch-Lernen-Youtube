import { getUserFromRequest } from "@/lib/supabaseServer";
import { corsHeaders } from "@/lib/cors";

// POST /api/vocabulary/mark-learned — set learned_at cho các id của caller còn null.
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const auth = await getUserFromRequest(req);
    if (!auth)
      return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    const body = await req.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((x: unknown) => typeof x === "string")
      : [];
    // rỗng / không phải mảng → no-op.
    if (ids.length === 0)
      return Response.json({ ok: true }, { status: 200, headers: cors });

    // RLS lọc theo caller; chỉ set khi learned_at is null (idempotent).
    const { error } = await auth.supabase
      .from("vocabulary")
      .update({ learned_at: new Date().toISOString() })
      .in("id", ids)
      .is("learned_at", null);
    if (error)
      return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
    return Response.json({ ok: true }, { status: 200, headers: cors });
  } catch {
    return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
  }
}
