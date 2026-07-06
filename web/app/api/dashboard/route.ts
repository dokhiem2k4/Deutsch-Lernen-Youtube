import { getUserFromRequest } from "@/lib/supabaseServer";
import { corsHeaders } from "@/lib/cors";

// GET /api/dashboard — RPC get_dashboard() qua scoped-JWT (auth.uid() bên trong func).
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function GET(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const auth = await getUserFromRequest(req);
    if (!auth)
      return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    const { data, error } = await auth.supabase.rpc("get_dashboard");
    if (error)
      return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
    return Response.json(data, { status: 200, headers: cors });
  } catch {
    return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
  }
}
