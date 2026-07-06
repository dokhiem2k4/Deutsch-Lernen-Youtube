// Cài đặt phụ đề — lưu chrome.storage.local (key dl-settings). Realtime qua onChanged.
// clampSettings pure → unit-test được.

export type Settings = {
  showDe: boolean;
  showVi: boolean;
  bgEnabled: boolean;
  bgOpacity: number; // 0..100
  fontSizePx: number; // 12..32
};

export const DEFAULT_SETTINGS: Settings = {
  showDe: true,
  showVi: true,
  bgEnabled: true,
  bgOpacity: 78,
  fontSizePx: 22,
};

const KEY = "dl-settings";

function clampNum(v: unknown, min: number, max: number, def: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : def;
  return Math.min(max, Math.max(min, Math.round(n)));
}
function bool(v: unknown, def: boolean): boolean {
  return typeof v === "boolean" ? v : def;
}

// Kẹp biên + điền default cho field thiếu/sai kiểu.
export function clampSettings(s: Partial<Settings> | null | undefined): Settings {
  const o = s ?? {};
  return {
    showDe: bool(o.showDe, DEFAULT_SETTINGS.showDe),
    showVi: bool(o.showVi, DEFAULT_SETTINGS.showVi),
    bgEnabled: bool(o.bgEnabled, DEFAULT_SETTINGS.bgEnabled),
    bgOpacity: clampNum(o.bgOpacity, 0, 100, DEFAULT_SETTINGS.bgOpacity),
    fontSizePx: clampNum(o.fontSizePx, 12, 32, DEFAULT_SETTINGS.fontSizePx),
  };
}

export async function getSettings(): Promise<Settings> {
  try {
    const o = await chrome.storage.local.get(KEY);
    return o[KEY] ? clampSettings(o[KEY] as Partial<Settings>) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = clampSettings({ ...current, ...patch });
  try {
    await chrome.storage.local.set({ [KEY]: next });
  } catch {
    // bỏ qua lỗi ghi
  }
  return next;
}

// Subscribe thay đổi settings (realtime). Trả hàm unsubscribe.
export function onSettingsChanged(cb: (s: Settings) => void): () => void {
  const listener = (
    changes: { [k: string]: chrome.storage.StorageChange },
    area: string
  ): void => {
    if (area !== "local" || !changes[KEY]) return;
    cb(clampSettings(changes[KEY].newValue as Partial<Settings>));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
