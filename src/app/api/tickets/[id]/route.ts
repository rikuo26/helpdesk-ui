export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

const JSONH = { "content-type": "application/json; charset=utf-8" };
type Ticket = { id: number | string; [k: string]: any };

export async function GET(req: Request, ctx: any) {
  const idRaw = String(ctx?.params?.id ?? "");
  try {
    // 上流(Functions)に詳細APIがあればそのまま返す
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (upstream.ok) return upstream;
  } catch {}
  // フォールバック: 一覧から拾う
  try {
    const listRes = await proxyToFunc(req, "/api/tickets?scope=all");
    const list = (await listRes.json()) as Ticket[];
    const hit = list.find(t => String((t as any).id) === idRaw) ?? null;
    if (hit) return new Response(JSON.stringify(hit), { status: 200, headers: JSONH });
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: JSONH });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e?.message ?? "failed" }), { status: 500, headers: JSONH });
  }
}

export async function DELETE(req: Request, ctx: any) {
  const id = String(ctx?.params?.id ?? "");
  if (!id) return new Response(JSON.stringify({ error: "id_required" }), { status: 400, headers: JSONH });

  // DELETE は上流に無いので、PATCH で status: "deleted" に更新してソフト削除扱いにする
  const origin = new URL(req.url).origin;
  try {
    const r = await fetch(`${origin}/api/proxy-tickets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "deleted" }),
      cache: "no-store",
    });
    if (r.ok) return new Response(null, { status: 204 });
    const body = await r.text().catch(() => "");
    return new Response(JSON.stringify({ error: "delete_failed", upstream: r.status, body: body.slice(0,200) }), { status: 500, headers: JSONH });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e?.message ?? "delete_failed" }), { status: 500, headers: JSONH });
  }
}