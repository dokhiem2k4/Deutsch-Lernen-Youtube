// Pure helpers cho phụ đề — KHÔNG phụ thuộc DOM/chrome → unit-test được bằng node.

export type Cue = { start: number; dur: number; text: string };

type Json3Seg = { utf8?: unknown };
type Json3Event = { tStartMs?: unknown; dDurationMs?: unknown; segs?: unknown };

// Parse YouTube timedtext fmt=json3 → Cue[] (giây). Bỏ event rỗng (không segs / chỉ khoảng trắng).
export function parseJson3(input: unknown): Cue[] {
  let data: unknown = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      return [];
    }
  }
  const events =
    data && typeof data === "object" && Array.isArray((data as { events?: unknown }).events)
      ? ((data as { events: Json3Event[] }).events)
      : [];

  const cues: Cue[] = [];
  for (const ev of events) {
    if (!ev || !Array.isArray(ev.segs)) continue;
    const text = (ev.segs as Json3Seg[])
      .map((s) => (typeof s?.utf8 === "string" ? s.utf8 : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const start = typeof ev.tStartMs === "number" ? ev.tStartMs / 1000 : 0;
    const dur = typeof ev.dDurationMs === "number" ? ev.dDurationMs / 1000 : 0;
    cues.push({ start, dur, text });
  }
  return cues;
}

// Cue đang hiện tại t: start lớn nhất thỏa start ≤ t < start+dur. Không có → null (ẩn).
export function pickCue(cues: Cue[], t: number): Cue | null {
  let best: Cue | null = null;
  for (const c of cues) {
    if (t >= c.start && t < c.start + c.dur) {
      if (!best || c.start > best.start) best = c;
    }
  }
  return best;
}

// Trang anti-bot "Sorry/automated queries" của Google (không phải json3).
export function isAntiBot(text: string): boolean {
  if (!text) return false;
  const head = text.trimStart().slice(0, 1000).toLowerCase();
  if (head.startsWith("{")) return false; // payload json3 hợp lệ
  return (
    head.includes("automated queries") ||
    head.includes("unusual traffic") ||
    head.includes("sorry")
  );
}

// Từ baseUrl đã ký của player, thêm fmt=json3 + tlang (VI). KHÔNG tự dựng URL mới.
export function buildUrl(baseUrl: string, opts: { tlang?: string } = {}): string {
  const url = new URL(baseUrl);
  url.searchParams.set("fmt", "json3");
  if (opts.tlang) url.searchParams.set("tlang", opts.tlang);
  else url.searchParams.delete("tlang");
  return url.toString();
}
