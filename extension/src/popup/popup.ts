import { APP_URL } from "../lib/env";
import { SESSION_STORAGE_KEY, type ExtSession } from "../lib/supabaseExt";

// Popup: hiện email nếu đã login (đọc session từ chrome.storage.local do background lưu),
// nút mở web (login/học), nút đăng xuất. Render as text (không innerHTML).

async function getSession(): Promise<ExtSession | null> {
  try {
    const o = await chrome.storage.local.get(SESSION_STORAGE_KEY);
    return (o[SESSION_STORAGE_KEY] as ExtSession) ?? null;
  } catch {
    return null;
  }
}

function openWeb(): void {
  chrome.tabs.create({ url: APP_URL });
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = label;
  b.className = "btn";
  b.addEventListener("click", onClick);
  return b;
}

function render(session: ExtSession | null): void {
  const status = document.getElementById("status");
  const actions = document.getElementById("actions");
  if (!status || !actions) return;
  status.textContent = "";
  actions.textContent = "";

  if (session?.user) {
    status.textContent = `Đã đăng nhập: ${session.user.email ?? session.user.id}`;
    actions.append(
      button("Mở web học", openWeb),
      button("Đăng xuất", async () => {
        try {
          await chrome.runtime.sendMessage({ type: "SM_LOGOUT" });
        } catch {
          // background chưa sẵn → vẫn cập nhật UI
        }
        render(null);
      })
    );
  } else {
    status.textContent = "Chưa đăng nhập.";
    actions.append(button("Mở web đăng nhập", openWeb));
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  render(await getSession());
});
