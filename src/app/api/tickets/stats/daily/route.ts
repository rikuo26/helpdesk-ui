export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id:number; createdAt:string; createdBy?:string|null; status?:string|null };
const toInt = (v:any, d:number)=>{ const n = Number(v); return Number.isFinite(n)?n:d; };

async function computeDaily(origin:string, days:number) {
  const r = await fetch(`${origin}/api/tickets?scope=all`, { cache:"no-store" });
  const list = (await r.json()) as Ticket[];

  const today = new Date(); today.setUTCHours(0,0,0,0);
  const labels:string[] = []; const counts:Record<string,number> = {};
  for (let i=days-1;i>=0;i--) {
    const d = new Date(today); d.setUTCDate(today.getUTCDate()-i);
    const key = d.toISOString().slice(0,10);
    labels.push(key); counts[key]=0;
  }
  for (const t of list) {
    const key = new Date(t.createdAt).toISOString().slice(0,10);
    if (key in counts) counts[key]++;
  }
  const items = labels.map(k=>({ date:k, count:counts[k] }));
  const data  = items.map(i=>i.count);
  return { items, labels, data, series: data };
}

export async function GET(req: Request) {
  try {
    const upstream = await proxyToFunc(req, "/api/tickets/stats/daily");
    if (upstream.ok) return upstream;
  } catch {}
  const url = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  const origin = url.origin;
  const body = await computeDaily(origin, days);
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type":"application/json; charset=utf-8" } });
}