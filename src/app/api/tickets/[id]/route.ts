export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id: number | string; [k: string]: any };

// GET /api/tickets/:id
export async function GET(req: Request, ctx: any) {
  const idRaw = String(ctx?.params?.id ?? "");

  // 1) 上流 Functions に個別 endpoint があれば委譲
  try {
    const upstream = await proxyToFunc(req, `/api/tickets/${encodeURIComponent(idRaw)}`);
    if (upstream.ok) return upstream; // 200 系ならそのまま返す
  } catch {}

  // 2) フォールバック: 一覧(scope=all)から該当IDを抽出
  try {
    const listRes = await proxyToFunc(req, "/api/tickets?scope=all");
    const list = (await listRes.json()) as Ticket[];
    const hit =
      list.find(t => String((t as any).id) === idRaw) ??
      null;

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