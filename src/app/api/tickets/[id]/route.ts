export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id: number | string; status?: string | null; deleted?: any; [k: string]: any };

function isDeleted(t: Ticket) {
  const st = String(t?.status ?? "").toLowerCase();
  const del = (t as any)?.deleted;
  return st === "deleted" || del === true || del === "true" || del === 1 || del === "1";
}

// ---- GET /api/tickets/:id（既存＋削除済みはヒット扱いにしない）
export async function GET(req: Request, ctx: any) {
  const idRaw = String(ctx?.params?.id ?? "");
  try {
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (upstream.ok) return upstream;
  } catch {}

  try {
    const listRes = await proxyToFunc(req, "/api/tickets?scope=all");
    const list = (await listRes.json()) as Ticket[];
    const hit = (Array.isArray(list) ? list : [])
      .filter(t => !isDeleted(t))
      .find(t => String(t.id) === idRaw) ?? null;

    if (hit) {
      return new Response(JSON.stringify(hit), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "failed" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}

// ---- DELETE /api/tickets/:id（本物の DELETE が無い場合は PATCH でソフト削除）
export async function DELETE(req: Request, ctx: any) {
  const idRaw = String(ctx?.params?.id ?? "");

  // 1) 上流に DELETE があればそのまま利用
  try {
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (upstream.ok || upstream.status === 204) return upstream;
  } catch {}

  // 2) フォールバック: PATCH で {deleted:true, status:"deleted"}
  try {
    const headers = new Headers(req.headers);
    headers.set("content-type", "application/json");
    const patchReq = new Request(req.url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ deleted: true, status: "deleted" }),
    });

    const patched = await proxyToFunc(patchReq, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (patched.ok) return new Response(null, { status: 204 });

    const text = await patched.text().catch(() => "");
    return new Response(text || JSON.stringify({ error: "delete_failed" }), {
      status: patched.status || 500,
      headers: { "content-type": patched.headers.get("content-type") || "application/json; charset=utf-8" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "delete_failed" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
}