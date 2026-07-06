import { pickCue, type Cue } from "../lib/captions";

// ISOLATED, document_idle. Nhận cues từ yt-intercept (MAIN) qua postMessage,
// vẽ overlay 2 dòng (Đức + Việt) trong #movie_player đồng bộ video.currentTime.
// Ẩn caption gốc bằng CSS (không phá DOM). Không throw — lỗi → im lặng.

type State = { de: Cue[]; vi: Cue[]; viStatus: string };
let state: State = { de: [], vi: [], viStatus: "empty" };

// CHỈ tin message cùng window + source:'DL' (không tin message ngoài).
window.addEventListener("message", (e: MessageEvent) => {
  if (e.source !== window) return;
  const d = e.data;
  if (!d || d.source !== "DL" || d.type !== "CAPTIONS") return;
  state = {
    de: Array.isArray(d.de) ? d.de : [],
    vi: Array.isArray(d.vi) ? d.vi : [],
    viStatus: typeof d.viStatus === "string" ? d.viStatus : "empty",
  };
});

// Reset khi đổi video (SPA).
window.addEventListener("yt-navigate-finish", () => {
  state = { de: [], vi: [], viStatus: "empty" };
});

let overlay: HTMLDivElement | null = null;
let rowDe: HTMLDivElement | null = null;
let rowVi: HTMLDivElement | null = null;
let bubbleDe: HTMLSpanElement | null = null;
let bubbleVi: HTMLSpanElement | null = null;

function injectCss(): void {
  if (document.getElementById("dl-caption-style")) return;
  const style = document.createElement("style");
  style.id = "dl-caption-style";
  style.textContent = `
    .ytp-caption-window-container, .caption-window { display: none !important; }
    #dl-caption-overlay {
      position: absolute; left: 0; right: 0; bottom: 8%;
      z-index: 30; text-align: center; pointer-events: none; padding: 0 5%;
      font-family: system-ui, Arial, sans-serif;
    }
    #dl-caption-overlay .dl-row { display: block; margin: 3px 0; }
    #dl-caption-overlay .dl-de, #dl-caption-overlay .dl-vi {
      display: inline-block; max-width: 92%;
      background: rgba(0,0,0,0.78); color: #fff; border-radius: 6px;
      padding: 2px 10px; line-height: 1.35;
      text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    }
    #dl-caption-overlay .dl-de { font-size: clamp(14px, 2.2vw, 30px); }
    #dl-caption-overlay .dl-vi { font-size: clamp(12px, 1.9vw, 26px); color: #ffe08a; }
    #dl-caption-overlay .dl-blocked { opacity: 0.6; font-size: clamp(11px, 1.4vw, 18px); }
  `;
  document.documentElement.appendChild(style);
}

function ensureOverlay(): HTMLDivElement | null {
  const player = document.getElementById("movie_player");
  if (!player) return null;
  if (overlay && overlay.isConnected) return overlay;

  overlay = document.createElement("div");
  overlay.id = "dl-caption-overlay";

  rowDe = document.createElement("div");
  rowDe.className = "dl-row";
  bubbleDe = document.createElement("span");
  bubbleDe.className = "dl-de";
  rowDe.appendChild(bubbleDe);

  rowVi = document.createElement("div");
  rowVi.className = "dl-row";
  bubbleVi = document.createElement("span");
  bubbleVi.className = "dl-vi";
  rowVi.appendChild(bubbleVi);

  overlay.append(rowDe, rowVi);
  player.appendChild(overlay);
  return overlay;
}

function setRow(row: HTMLDivElement | null, bubble: HTMLSpanElement | null, text: string, blocked = false): void {
  if (!row || !bubble) return;
  if (text) {
    bubble.textContent = text;
    bubble.classList.toggle("dl-blocked", blocked);
    row.style.display = "block";
  } else {
    row.style.display = "none";
  }
}

function tick(): void {
  try {
    const video = document.querySelector<HTMLVideoElement>("#movie_player video");
    if (video && ensureOverlay()) {
      injectCss();
      const t = video.currentTime;
      const de = pickCue(state.de, t);
      const vi = pickCue(state.vi, t);
      setRow(rowDe, bubbleDe, de ? de.text : "");
      if (vi) {
        setRow(rowVi, bubbleVi, vi.text, false);
      } else if (de && state.viStatus === "blocked") {
        setRow(rowVi, bubbleVi, "— bản dịch tự động bị chặn —", true);
      } else {
        setRow(rowVi, bubbleVi, "");
      }
    }
  } catch {
    // im lặng — không vỡ trang
  }
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
