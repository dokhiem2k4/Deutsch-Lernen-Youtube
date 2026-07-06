// CORS — phản chiếu origin hợp lệ (web + chrome-extension), KHÔNG bao giờ "*".
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
  if (origin && (origin === APP_URL || origin.startsWith("chrome-extension://"))) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
