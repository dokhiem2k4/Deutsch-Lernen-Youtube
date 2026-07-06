import { STORAGE_KEY, parseSession } from "../lib/supabaseExt";

// Chạy TRÊN ORIGIN WEB (manifest match APP_URL). Đọc session Supabase ở localStorage web
// → forward sang background. Poll để bắt login/logout. KHÔNG tự login.
// Guard "Extension context invalidated": chrome.runtime.id undefined → dừng poll, không loop.

let lastSent: string | null = null;

function currentRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function sync(): Promise<void> {
  // Extension reload/gỡ → context invalidated → dừng hẳn.
  if (!chrome.runtime?.id) {
    clearInterval(timer);
    return;
  }
  const raw = currentRaw();
  if (raw === lastSent) return; // không đổi → khỏi gửi
  lastSent = raw;
  const session = parseSession(raw);
  try {
    await chrome.runtime.sendMessage(
      session ? { type: "SM_SESSION", session } : { type: "SM_LOGOUT" }
    );
  } catch {
    // background chưa sẵn / context invalidated giữa chừng → thử lại lần poll sau
    lastSent = null;
  }
}

const timer = setInterval(sync, 1500);
void sync();
