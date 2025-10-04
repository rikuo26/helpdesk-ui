export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ctx = { params: Promise<{ id: string }> };
const JSONH = { "content-type": "application/json; charset=utf-8" };

type Ticket = { id: number | string; [k: string]: any };

// --- GET（保持：上流→ダメなら一覧から抽出）
export async function GET(req: Request, ctx: Ctx) {
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
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e?.message ?? "failed" }), { status: 500, headers: JSONH });
  }
}

// --- PATCH（保持：そのまま上流へ）
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}

// --- DELETE：3段フォールバック＋デバッグヘッダー
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const dbg:any = { id:String(id) };

  // A) 本物の DELETE
  try {
    const del = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
    dbg.A = del.status;
    if (del.ok || del.status === 204) {
      return new Response(null, { status: 204, headers: { "x-debug-delete": JSON.stringify(dbg).slice(0,200) }});
    }
  } catch (e:any) { dbg.A = `ERR:${e?.message ?? e}`; }

  // B) PATCH { status:"deleted" }
  try {
    const headers = new Headers(req.headers); headers.set("content-type","application/json");
    const softReq = new Request(req.url, { method:"PATCH", headers, body: JSON.stringify({ status: "deleted" }) });
    const r = await proxyToFunc(softReq, `/api/tickets/${encodeURIComponent(id)}`);
    dbg.B = r.status;
    if (r.ok) {
      return new Response(null, { status: 204, headers: { "x-debug-delete": JSON.stringify(dbg).slice(0,200) }});
    }
  } catch (e:any) { dbg.B = `ERR:${e?.message ?? e}`; }

  // C) POST（保存API流用）{ id, status:"deleted" }
  try {
    const postReq = new Request(req.url, { method:"POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: "deleted" }) });
    const r = await proxyToFunc(postReq, `/api/tickets`);
    dbg.C = r.status;
    if (r.ok) {
      return new Response(null, { status: 204, headers: { "x-debug-delete": JSON.stringify(dbg).slice(0,200) }});
    }
  } catch (e:any) { dbg.C = `ERR:${e?.message ?? e}`; }

  return new Response(JSON.stringify({ error: "delete_failed", debug: dbg }), { status: 500, headers: JSONH });
}