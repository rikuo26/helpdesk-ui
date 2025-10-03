export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id:number; createdAt:string; createdBy?:string|null; status?:string|null };
const toInt = (v:any, d:number)=>{ const n = Number(v); return Number.isFinite(n)?n:d; };

async function computeUsers(origin:string, days:number) {
  const r = await fetch(`${origin}/api/tickets?scope=all`, { cache:"no-store" });
  const list = (await r.json()) as Ticket[];
  const cutoff = Date.now() - days*86400000;
  const map = new Map<string, number>();
  for (const t of list) {
    const ts = +new Date(t.createdAt);
    if (!Number.isFinite(ts) || ts < cutoff) continue;
    const key = (t.createdBy ?? "unknown") + "";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const items = [...map.entries()]
    .map(([name,count])=>({ name, count, total: count }))
    .sort((a,b)=>b.count-a.count)
    .slice(0,10);
  return {
    array: items,
    full:  { items, labels: items.map(i=>i.name), data: items.map(i=>i.count) }
  };
}

export async function GET(req: Request) {
  try {
    const upstream = await proxyToFunc(req, "/api/tickets/stats/users");
    if (upstream.ok) return upstream;
  } catch {}
  const url = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  const origin = url.origin;
  const { array, full } = await computeUsers(origin, days);
  // shape=full のときだけ従来のオブジェクト形、既定は配列を返す
  const shape = (url.searchParams.get("shape") ?? "").toLowerCase();
  const payload = (shape === "full" || shape === "1") ? full : array;
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type":"application/json; charset=utf-8" }
  });
}