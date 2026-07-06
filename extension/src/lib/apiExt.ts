import { APP_URL } from "./env";

// Message content ↔ background + helper gọi API web (né CORS: content không fetch trực tiếp).
export type SmApiRequest = {
  type: "SM_API";
  method: string;
  path: string;
  body?: unknown;
};

export type SmApiResponse<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

// Content-side: gửi message tới background, chờ kết quả. Guard context-invalidated (không throw).
export function smApi<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<SmApiResponse<T>> {
  if (!chrome.runtime?.id) {
    return Promise.resolve({ ok: false, status: 0, error: "context_invalidated" });
  }
  return chrome.runtime
    .sendMessage({ type: "SM_API", method, path, body } satisfies SmApiRequest)
    .catch(() => ({ ok: false, status: 0, error: "no_background" }) as SmApiResponse<T>);
}

// Background-side: fetch API web bằng Bearer token. LUÔN trả SmApiResponse, không throw.
export async function proxyFetch<T = unknown>(
  method: string,
  path: string,
  body: unknown,
  token: string
): Promise<SmApiResponse<T>> {
  try {
    const res = await fetch(`${APP_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body != null && method.toUpperCase() !== "GET" ? JSON.stringify(body) : undefined,
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // body rỗng → data null
    }
    if (!res.ok) {
      const err =
        data && typeof data === "object" && typeof (data as Record<string, unknown>).error === "string"
          ? ((data as Record<string, unknown>).error as string)
          : "http_error";
      return { ok: false, status: res.status, error: err };
    }
    return { ok: true, status: res.status, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "network_error" };
  }
}
