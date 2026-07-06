// Public health endpoint — không auth (Blueprint §4).
export async function GET() {
  return Response.json({ status: "ok" });
}
