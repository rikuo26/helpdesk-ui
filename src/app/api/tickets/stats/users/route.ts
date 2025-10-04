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

async function pullAllTickets(req: Request): Promise<Ticket[]> {
  try {
    const res = await proxyToFunc(req, "/api/tickets?scope=all");
    const list = res.ok ? await res.json() : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("[stats/users] pullAllTickets failed:", e);
    return [];
  }
}

function computeUsers(list:Ticket[], days:number) {
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
  // 1) Functions にあればそれを返す
  try {
    const upstream = await proxyToFunc(req, "/api/tickets/stats/users");
    if (upstream.ok) return upstream;
  } catch {}

  // 2) Next 側フォールバック
  const url = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  const shape = (url.searchParams.get("shape") ?? "").toLowerCase();

  const list = await pullAllTickets(req);
  const { array, full } = computeUsers(list, days);
  const payload = (shape === "full" || shape === "1") ? full : array;

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type":"application/json; charset=utf-8" }
  });
}