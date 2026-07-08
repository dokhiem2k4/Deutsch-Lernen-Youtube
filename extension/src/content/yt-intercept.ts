import { parseJson3, buildUrl, isAntiBot, type Cue } from "../lib/captions";

// MAIN world, document_start. Player YouTube tự gọi URL timedtext ĐÃ KÝ → ta quan sát,
// refetch DE (fmt=json3) + VI (tlang=vi) từ CHÍNH baseUrl đó (không tự dựng URL → né anti-bot),
// rồi postMessage sang ISOLATED (youtube.ts). KHÔNG chặn/sửa request gốc của player.

const TIMEDTEXT = "/api/timedtext";
const seen = new Set<string>();

function isTimedText(url: string): boolean {
  return url.includes(TIMEDTEXT);
}

function absolutize(url: string): string {
  try {
    return new URL(url, location.href).toString();
  } catch {
    return url;
  }
}

function dedupeKey(url: string): string {
  try {
    const u = new URL(url, location.href);
    u.searchParams.delete("fmt");
    u.searchParams.delete("tlang");
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// DE: không anti-bot dịch (bản gốc) → null nếu lỗi/rỗng.
async function fetchDe(url: string): Promise<Cue[] | null> {
  const text = await fetchText(url);
  if (text == null || isAntiBot(text)) return null;
  const cues = parseJson3(text);
  return cues.length ? cues : null;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// VI: auto-translate có thể dính anti-bot YouTube. Anti-bot theo NHỊP (rate) → retry ngay
// lập tức vô ích; cần backoff tăng dần + tách nhịp khỏi request DE ngay trước đó.
async function fetchVi(url: string): Promise<{ cues: Cue[]; status: "ok" | "blocked" | "empty" }> {
  const delays = [500, 1500, 3000]; // trước mỗi lần thử (ms)
  let sawText = false;
  for (let i = 0; i < delays.length; i++) {
    await sleep(delays[i]);
    const text = await fetchText(url);
    if (text == null) continue; // lỗi mạng → thử lại
    sawText = true;
    if (isAntiBot(text)) {
      console.log("[DL-DEBUG] VI anti-bot, attempt", i + 1, "/", delays.length);
      continue;
    }
    const cues = parseJson3(text);
    return { cues, status: cues.length ? "ok" : "empty" };
  }
  return { cues: [], status: sawText ? "blocked" : "empty" };
}

async function handleTimedText(rawUrl: string): Promise<void> {
  const key = dedupeKey(rawUrl);
  if (seen.has(key)) return;
  seen.add(key);

  const base = absolutize(rawUrl);
  const de = await fetchDe(buildUrl(base));
  if (!de) return; // không có DE → im lặng, không post

  const vi = await fetchVi(buildUrl(base, { tlang: "vi" }));
  post(de, vi.cues, vi.status);
}

function post(de: Cue[], vi: Cue[], viStatus: string): void {
  try {
    window.postMessage({ source: "DL", type: "CAPTIONS", de, vi, viStatus }, location.origin);
  } catch {
    // không throw ra player
  }
}

// --- patch fetch (quan sát, không chặn) ---
const origFetch = window.fetch.bind(window);
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (url && isTimedText(url)) void handleTimedText(url);
  } catch {
    // bỏ qua — không ảnh hưởng request gốc
  }
  return origFetch(input, init);
};

// --- patch XHR.open (quan sát) ---
const origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (
  this: XMLHttpRequest,
  method: string,
  url: string | URL
): void {
  try {
    const u = typeof url === "string" ? url : url.href;
    if (isTimedText(u)) void handleTimedText(u);
  } catch {
    // bỏ qua
  }
  // giữ nguyên mọi tham số gốc (async/user/password)
  return origOpen.apply(this, arguments as unknown as Parameters<typeof origOpen>);
};

// SPA đổi video → cho phép refetch base mới.
window.addEventListener("yt-navigate-finish", () => seen.clear());
