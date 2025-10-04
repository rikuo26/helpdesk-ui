export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type ParamsP = Promise<{ id: string }>;
const JSONH = { "content-type": "application/json; charset=utf-8" };
type Ticket = { id: number | string; [k: string]: any };

// --- GET: 上流に無ければ一覧から拾う
export async function GET(req: Request, ctx: { params: ParamsP }) {
  const { id } = await ctx.params;
  try {
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
    if (upstream.ok) return upstream;
  } catch {}
  try {
    const listRes = await proxyToFunc(req, "/api/tickets?scope=all");
    const list = (await listRes.json()) as Ticket[];
    const hit = (Array.isArray(list) ? list : []).find(t => String(t.id) === String(id)) ?? null;
    if (hit) return new Response(JSON.stringify(hit), { status: 200, headers: JSONH });
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: JSONH });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "failed" }), { status: 500, headers: JSONH });
  }
}

// --- PATCH: そのまま上流へ
export async function PATCH(req: Request, ctx: { params: ParamsP }) {
  const { id } = await ctx.params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}

// --- DELETE: まず上流 DELETE、ダメなら proxy-tickets に PATCH でソフト削除
export async function DELETE(req: Request, ctx: { params: ParamsP }) {
  const { id } = await ctx.params;
  if (!id) return new Response(JSON.stringify({ error: "id_required" }), { status: 400, headers: JSONH });

  // 1) 本物の DELETE（上流にあればそのまま成功）
  try {
    const del = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
    if (del.ok || del.status === 204) return del;
  } catch {}

  // 2) フォールバック: Next の proxy ルート経由で PATCH（status/deleted を両方付与）
  try {
    const origin = new URL(req.url).origin;
    const soft = await fetch(`${origin}/api/proxy-tickets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "deleted", deleted: true }),
      cache: "no-store",
    });
    if (soft.ok || soft.status === 204) return new Response(null, { status: 204 });

    const body = await soft.text().catch(() => "");
    return new Response(body || JSON.stringify({ error: "delete_failed_upstream" }),
      { status: soft.status || 500, headers: JSONH });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "delete_failed" }),
      { status: 500, headers: JSONH });
  }
}