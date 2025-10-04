export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { status?: string | null; deleted?: any; [k: string]: any };
const isDel = (t: Ticket) => {
  const st = String(t?.status ?? "").toLowerCase();
  const del = (t as any)?.deleted;
  return st === "deleted" || del === true || del === "true" || del === 1 || del === "1";
};

export async function GET(req: Request) {
  const u = new URL(req.url);
  const upstream = await proxyToFunc(req, `/api/tickets${u.search}`);
  try {
    const ct = upstream.headers.get("content-type") || "";
    if (!upstream.ok || !ct.includes("application/json")) return upstream;
    const data = await upstream.json();
    if (!Array.isArray(data)) return upstream;
    const filtered = data.filter((t: Ticket) => !isDel(t));
    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch {
    return upstream;
  }
}

export async function POST(req: Request) {
  return proxyToFunc(req, "/api/tickets"); // そのまま委譲
}