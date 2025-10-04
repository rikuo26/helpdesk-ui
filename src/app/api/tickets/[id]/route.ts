export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ctx = { params?: { id?: string } };
const JSONH = { "content-type":"application/json; charset=utf-8" };

type Ticket = { id: number | string; [k: string]: any };

// --- GET: 上流に無ければ一覧から拾う
export async function GET(req: Request, ctx: Ctx) {
  const id = String(ctx?.params?.id ?? "");
  try {
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
    if (upstream.ok) return upstream;
  } catch {}
  try {
    const listRes = await proxyToFunc(req, "/api/tickets?scope=all");
    const list = (await listRes.json()) as Ticket[];
    const hit = (Array.isArray(list) ? list : []).find(t => String(t.id) === id) ?? null;
    if (hit) return new Response(JSON.stringify(hit), { status: 200, headers: JSONH });
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: JSONH });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "failed" }), { status: 500, headers: JSONH });
  }
}

// --- PATCH: そのまま上流へ
export async function PATCH(req: Request, ctx: Ctx) {
  const id = String(ctx?.params?.id ?? "");
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}

// --- DELETE: まず上流 DELETE、ダメなら PATCH(status:"deleted") にフォールバック
export async function DELETE(req: Request, ctx: Ctx) {
  const id = String(ctx?.params?.id ?? "");
  if (!id) return new Response(JSON.stringify({ error: "id_required" }), { status: 400, headers: JSONH });

  // 1) 本物の DELETE（上流にあればそのまま成功）
  try {
    const del = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
    if (del.ok || del.status === 204) return del;
  } catch {}

  // 2) フォールバック: PATCH で status:"deleted"
  try {
    const headers = new Headers(req.headers);
    headers.set("content-type", "application/json");
    const softReq = new Request(req.url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "deleted" })
    });
    const patched = await proxyToFunc(softReq, `/api/tickets/${encodeURIComponent(id)}`);
    if (patched.ok) return new Response(null, { status: 204 });

    const body = await patched.text().catch(() => "");
    return new Response(body || JSON.stringify({ error: "delete_failed_upstream" }), {
      status: patched.status || 500,
      headers: JSONH
    });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e?.message ?? "delete_failed" }), { status: 500, headers: JSONH });
  }
}