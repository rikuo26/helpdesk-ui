export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id: number | string; [k: string]: any };

// GET（既存と同じ振る舞い：上流→ダメなら一覧から抽出）
export async function GET(req: Request, ctx: any) {
  const idRaw = String(ctx?.params?.id ?? "");
  try {
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (upstream.ok) return upstream;
  } catch {}
  try {
    const listRes = await proxyToFunc(req, "/api/tickets?scope=all");
    const list = (await listRes.json()) as Ticket[];
    const hit = list.find(t => String((t as any).id) === idRaw) ?? null;
    if (hit) return Response.json(hit);
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404, headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "failed" }), {
      status: 500, headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
}

// DELETE：上流 DELETE を試し、ダメなら PATCH で status: "deleted"
export async function DELETE(req: Request, ctx: any) {
  const idRaw = String(ctx?.params?.id ?? "");
  try {
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (upstream.ok || upstream.status === 204) return upstream;
  } catch {}
  try {
    const patchReq = new Request(req.url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "deleted" })
    });
    const r = await proxyToFunc(patchReq, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (r.ok) return new Response(null, { status: 204 });
  } catch {}
  return new Response(JSON.stringify({ error: "delete_failed" }), {
    status: 500, headers: { "content-type": "application/json; charset=utf-8" }
  });
}