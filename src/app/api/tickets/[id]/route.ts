export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

type Ctx = { params: Promise<{ id: string }> };

function pathOf(id: string) {
  return `/api/tickets/${encodeURIComponent(id)}`;
}

async function fetchJsonOrNull(res: Response) {
  try { return await res.json(); } catch { return null; }
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  // まず Functions の /api/tickets/{id}
  const res = await proxyToFunc(req, pathOf(id));
  if (res.status !== 404) return res;

  // 404 のときだけ一覧から補完
  const listRes = await proxyToFunc(new Request(req.url, { method: "GET", headers: req.headers }), "/api/tickets");
  const arr = await fetchJsonOrNull(listRes);
  const hit = Array.isArray(arr) ? arr.find((x: any) => x?.id === id) : null;
  if (!hit) return new Response(JSON.stringify({ message: "not found" }), { status: 404, headers: { "content-type":"application/json" } });
  return new Response(JSON.stringify(hit), { status: 200, headers: { "content-type":"application/json" } });
}