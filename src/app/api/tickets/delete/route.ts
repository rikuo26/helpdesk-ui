export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

export async function POST(req: Request) {
  const url = new URL(req.url);
  let id = url.searchParams.get("id") || "";
  if (!id) {
    try { const j = await req.json(); id = String(j?.id ?? ""); } catch {}
  }
  if (!id) {
    return new Response(JSON.stringify({ error: "missing_id" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  // 上流に PATCH で status: "deleted" を送る（ソフト削除）
  try {
    const patchReq = new Request(req.url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "deleted" }),
    });
    const r = await proxyToFunc(patchReq, `/api/tickets/${encodeURIComponent(id)}`);
    if (r.ok) return new Response(null, { status: 204 });
  } catch {}

  return new Response(JSON.stringify({ error: "delete_failed" }), {
    status: 500,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}