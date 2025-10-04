export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id:number; createdAt:any; createdBy?:string|null; status?:string|null };
const toInt = (v:any, d:number)=>{ const n = Number(v); return Number.isFinite(n)?n:d; };

function parseDate(src:any): Date | null {
  if (!src) return null;
  if (src instanceof Date) return Number.isFinite(+src) ? src : null;
  if (typeof src === "number") { const d = new Date(src); return Number.isFinite(+d) ? d : null; }
  const s = String(src).trim();
  let d = new Date(s);
  if (Number.isFinite(+d)) return d;
  const m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    const [_, y, mo, da, hh="0", mm="0", ss="0"] = m;
    d = new Date(Date.UTC(+y, +mo-1, +da, +hh, +mm, +ss));
    if (Number.isFinite(+d)) return d;
  }
  return null;
}

async function loadTickets(origin:string, cookie?:string|null){
  const headers: Record<string,string> = { "x-swa-bypass":"1" };
  if (cookie) headers["cookie"] = cookie;
  async function get(scope:"all"|"mine"){ return fetch(`${origin}/api/tickets?scope=${scope}`, { cache:"no-store", headers }); }
  let r = await get("all");
  if (r.status === 401 || r.status === 403) r = await get("mine");
  let list: Ticket[] = [];
  if (r.ok) {
    list = await r.json() as Ticket[];
    if (!Array.isArray(list) || list.length === 0) {
      const r2 = await get("mine");
      if (r2.ok) {
        const alt = await r2.json() as Ticket[];
        if (Array.isArray(alt) && alt.length > 0) list = alt;
      }
    }
  } else {
    throw new Error(`tickets-fetch ${r.status}`);
  }
  return list;
}

async function computeUsers(origin:string, days:number, cookie?:string|null) {
  const list = await loadTickets(origin, cookie);
  const cutoff = Date.now() - days*86400000;
  const map = new Map<string, number>();
  for (const t of list) {
    const d = parseDate(t.createdAt);
    if (!d || +d < cutoff) continue;
    const key = (t.createdBy ?? "unknown") + "";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const items = [...map.entries()]
    .map(([name,count])=>({ name, count, total: count }))
    .sort((a,b)=>b.count-a.count)
    .slice(0,10);
  return { array: items, full: { items, labels: items.map(i=>i.name), data: items.map(i=>i.count) } };
}

export async function GET(req: Request) {
  try {
    const upstream = await proxyToFunc(req, "/api/tickets/stats/users");
    if (upstream.ok) return upstream;
  } catch {}
  const url = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  const { array, full } = await computeUsers(url.origin, days, req.headers.get("cookie"));
  const shape = (url.searchParams.get("shape") ?? "").toLowerCase();
  const payload = (shape === "full" || shape === "1") ? full : array;
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type":"application/json; charset=utf-8" }
  });
}