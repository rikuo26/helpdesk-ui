export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { status?: string | null };

export async function GET(req: Request) {
  const u = new URL(req.url);
  try {
    const upstream = await proxyToFunc(req, `/api/tickets${u.search}`);
    if (!upstream.ok) return upstream;
    const data = await upstream.json();
    const filtered = Array.isArray(data)
      ? data.filter((t: Ticket) => {
          const st = (t.status ?? "").toLowerCase();
          return st !== "deleted" && st !== "_deleted";
        })
      : data;
    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e?.message ?? "list_failed" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

export async function POST(req: Request) {
  return proxyToFunc(req, "/api/tickets");
}