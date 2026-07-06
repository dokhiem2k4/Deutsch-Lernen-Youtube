import { createHash } from "crypto";
import { getUserFromRequest } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { lookupWord } from "@/lib/openai";
import { corsHeaders } from "@/lib/cors";

// POST /api/lookup-context (Blueprint §5).
// Verify user trước (401). Thao tác cache + OpenAI bằng service_role (cache dùng chung).
// KHÔNG BAO GIỜ 500 vì AI/mạng → fallback source:"error".
const FALLBACK = {
  lemma: null,
  article: null,
  meaning_vi: "",
  word_type: null,
  source: "error" as const,
};

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));

  // Auth ngoài try-fallback: thiếu/sai JWT phải là 401, không bị nuốt thành fallback.
  const auth = await getUserFromRequest(req);
  if (!auth)
    return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

  const body = await req.json().catch(() => null);
  const word = typeof body?.word === "string" ? body.word.trim() : "";
  const sentence = typeof body?.sentence === "string" ? body.sentence : "";
  if (!word || !sentence.trim())
    return Response.json(
      { error: "word and sentence required" },
      { status: 400, headers: cors }
    );

  try {
    const wordKey = word.toLowerCase();
    const contextHash = createHash("sha256")
      .update(sentence.trim())
      .digest("hex");
    const admin = supabaseAdmin();

    // 1. Cache hit → không gọi AI.
    const { data: cached } = await admin
      .from("ai_meaning_cache")
      .select("lemma, article, meaning_vi")
      .eq("word", wordKey)
      .eq("context_hash", contextHash)
      .maybeSingle();
    if (cached) {
      return Response.json(
        {
          lemma: cached.lemma,
          article: cached.article,
          meaning_vi: cached.meaning_vi,
          word_type: null,
          source: "cache",
        },
        { status: 200, headers: cors }
      );
    }

    // 2. Miss → OpenAI. Thiếu key / lỗi / JSON hỏng → fallback (KHÔNG 500).
    const result = await lookupWord(word, sentence);
    if (!result) return Response.json(FALLBACK, { status: 200, headers: cors });

    // 3. Ghi cache; trùng (23505 race) → bỏ qua, vẫn trả kết quả.
    await admin.from("ai_meaning_cache").insert({
      word: wordKey,
      context_hash: contextHash,
      lemma: result.lemma,
      article: result.article,
      meaning_vi: result.meaning_vi,
    });

    return Response.json({ ...result, source: "openai" }, { status: 200, headers: cors });
  } catch {
    // Bất ngờ (cache/mạng) vẫn KHÔNG vỡ UI.
    return Response.json(FALLBACK, { status: 200, headers: cors });
  }
}
