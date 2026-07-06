import { getUserFromRequest } from "@/lib/supabaseServer";
import { corsHeaders } from "@/lib/cors";

// /api/vocabulary — RLS qua scoped-JWT (KHÔNG service_role). user_id luôn từ JWT.
const COLS = "id, word, lemma, article, meaning_vi, example, learned_at, created_at";

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

// GET — mảng của caller, mới nhất trước.
export async function GET(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const auth = await getUserFromRequest(req);
    if (!auth)
      return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    const { data, error } = await auth.supabase
      .from("vocabulary")
      .select(COLS)
      .order("created_at", { ascending: false });
    if (error)
      return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
    return Response.json(data ?? [], { status: 200, headers: cors });
  } catch {
    return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
  }
}

// POST — idempotent theo UNIQUE(user_id, word). Trùng → trả dòng cũ, không overwrite.
export async function POST(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const auth = await getUserFromRequest(req);
    if (!auth)
      return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    const body = await req.json().catch(() => null);
    const word = typeof body?.word === "string" ? body.word.trim() : "";
    if (!word)
      return Response.json({ error: "word required" }, { status: 400, headers: cors });

    const row = {
      user_id: auth.user.id, // từ JWT, KHÔNG tin body
      word,
      lemma: typeof body?.lemma === "string" ? body.lemma : null,
      article:
        body?.article === "der" || body?.article === "die" || body?.article === "das"
          ? body.article
          : null,
      meaning_vi: typeof body?.meaning_vi === "string" ? body.meaning_vi : null,
      example: typeof body?.example === "string" ? body.example : null,
    };

    const { data, error } = await auth.supabase
      .from("vocabulary")
      .insert(row)
      .select(COLS)
      .single();

    if (error) {
      // 23505 = trùng UNIQUE → không lỗi, trả dòng cũ của caller (RLS lọc).
      if (error.code === "23505") {
        const { data: existing } = await auth.supabase
          .from("vocabulary")
          .select(COLS)
          .eq("word", word)
          .maybeSingle();
        if (existing) return Response.json(existing, { status: 200, headers: cors });
      }
      return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
    }
    return Response.json(data, { status: 200, headers: cors });
  } catch {
    return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
  }
}

// DELETE ?id= — RLS chặn xoá của người khác. Idempotent.
export async function DELETE(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const auth = await getUserFromRequest(req);
    if (!auth)
      return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    const id = new URL(req.url).searchParams.get("id");
    if (!id)
      return Response.json({ error: "id required" }, { status: 400, headers: cors });

    const { error } = await auth.supabase.from("vocabulary").delete().eq("id", id);
    if (error)
      return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
    return Response.json({ ok: true }, { status: 200, headers: cors });
  } catch {
    return Response.json({ error: "internal_error" }, { status: 500, headers: cors });
  }
}
