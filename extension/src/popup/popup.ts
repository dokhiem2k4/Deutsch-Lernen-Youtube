import { APP_URL } from "../lib/env";
import { SESSION_STORAGE_KEY, type ExtSession } from "../lib/supabaseExt";
import { getSettings, setSettings, type Settings } from "../lib/settings";

// Popup: F06 login/logout + F08 "Cài đặt phụ đề". Render as text (không innerHTML).

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

function renderAuth(session: ExtSession | null): void {
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
        renderAuth(null);
      })
    );
  } else {
    status.textContent = "Chưa đăng nhập.";
    actions.append(button("Mở web đăng nhập", openWeb));
  }
}

// ---- Settings ----
function row(label: string, control: HTMLElement): HTMLDivElement {
  const r = document.createElement("div");
  r.className = "set-row";
  const l = document.createElement("label");
  l.textContent = label;
  r.append(l, control);
  return r;
}

function toggle(checked: boolean, onChange: (v: boolean) => void): HTMLInputElement {
  const c = document.createElement("input");
  c.type = "checkbox";
  c.checked = checked;
  c.addEventListener("change", () => onChange(c.checked));
  return c;
}

function slider(
  min: number,
  max: number,
  value: number,
  unit: string,
  onInput: (v: number) => void
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "slider-wrap";
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.value = String(value);
  const out = document.createElement("span");
  out.className = "slider-val";
  out.textContent = `${value}${unit}`;
  input.addEventListener("input", () => {
    const v = Number(input.value);
    out.textContent = `${v}${unit}`;
    onInput(v);
  });
  wrap.append(input, out);
  return wrap;
}

async function renderSettings(): Promise<void> {
  const root = document.getElementById("settings");
  if (!root) return;
  root.textContent = "";
  const s: Settings = await getSettings();

  const title = document.createElement("h2");
  title.textContent = "Cài đặt phụ đề";
  root.append(title);

  root.append(
    row("Hiện tiếng Đức", toggle(s.showDe, (v) => void setSettings({ showDe: v }))),
    row("Hiện tiếng Việt", toggle(s.showVi, (v) => void setSettings({ showVi: v }))),
    row("Nền mờ sau chữ", toggle(s.bgEnabled, (v) => void setSettings({ bgEnabled: v }))),
    row("Cỡ chữ", slider(12, 32, s.fontSizePx, "px", (v) => void setSettings({ fontSizePx: v }))),
    row("Độ đậm nền", slider(0, 100, s.bgOpacity, "%", (v) => void setSettings({ bgOpacity: v })))
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  renderAuth(await getSession());
  await renderSettings();
});
