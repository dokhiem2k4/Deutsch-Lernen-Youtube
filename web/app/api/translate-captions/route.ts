import { createHash } from "crypto";
import { getUserFromRequest } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { translateLines } from "@/lib/translate";
import { corsHeaders } from "@/lib/cors";

// POST /api/translate-captions — dịch phụ đề DE→VI (fallback khi YouTube tlang bị chặn).
// Auth Bearer (endpoint tốn tiền). Cache theo (video_id, hash) qua service_role. KHÔNG 500 vì AI.
export const maxDuration = 60;

type Cue = { start: number; dur: number; text: string };

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function GET(req: Request) {
  // không hỗ trợ GET — trả 405 nhẹ (giữ CORS)
  return Response.json({ error: "method_not_allowed" }, { status: 405, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });

    const body = (await req.json().catch(() => null)) as
      | { video_id?: unknown; cues?: unknown; target_lang?: unknown }
      | null;
    const videoId = typeof body?.video_id === "string" ? body.video_id : "";
    const target = typeof body?.target_lang === "string" ? body.target_lang : "vi";
    const cues: Cue[] = Array.isArray(body?.cues)
      ? (body!.cues as unknown[]).filter(
          (c): c is Cue =>
            !!c && typeof (c as Cue).text === "string" && typeof (c as Cue).start === "number"
        )
      : [];

    if (!videoId || cues.length === 0) {
      return Response.json({ error: "video_id & cues required" }, { status: 400, headers: cors });
    }

    const sourceHash = createHash("sha256").update(cues.map((c) => c.text).join("\n")).digest("hex");
    const admin = supabaseAdmin();

    // cache hit?
    const { data: hit } = await admin
      .from("caption_translation_cache")
      .select("cues")
      .eq("video_id", videoId)
      .eq("source_hash", sourceHash)
      .eq("target_lang", target)
      .maybeSingle();
    if (hit?.cues) {
      return Response.json({ cues: hit.cues, source: "cache" }, { status: 200, headers: cors });
    }

    // miss → dịch
    const vi = await translateLines(cues.map((c) => c.text));
    if (!vi) {
      return Response.json({ cues: [], source: "error" }, { status: 200, headers: cors });
    }
    const viCues: Cue[] = cues.map((c, i) => ({ start: c.start, dur: c.dur, text: vi[i] ?? "" }));

    // ghi cache (idempotent — trùng thì bỏ qua)
    await admin
      .from("caption_translation_cache")
      .upsert(
        { video_id: videoId, source_hash: sourceHash, target_lang: target, cues: viCues },
        { onConflict: "video_id,source_hash,target_lang", ignoreDuplicates: true }
      );

    return Response.json({ cues: viCues, source: "openai" }, { status: 200, headers: cors });
  } catch {
    // KHÔNG bao giờ 500 vì dịch → fallback rỗng
    return Response.json({ cues: [], source: "error" }, { status: 200, headers: cors });
  }
}
