export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id:number; createdAt:string; createdBy?:string|null; status?:string|null };
const toInt = (v:any, d:number)=>{ const n = Number(v); return Number.isFinite(n)?n:d; };

async function computeSummary(origin:string, days:number) {
  const r = await fetch(`${origin}/api/tickets?scope=all`, { cache:"no-store" });
  const list = (await r.json()) as Ticket[];

  const total = list.length;
  const todayKey = new Date().toISOString().slice(0,10);
  let today_new = 0, done = 0, unresolved = 0;
  const users = new Set<string>();
  const cutoff = Date.now() - days*86400000;
  let recentCount = 0;

  for (const t of list) {
    const st = (t.status ?? "open").toLowerCase();
    if (st === "done") done++; else unresolved++;
    users.add((t.createdBy ?? "unknown") + "");
    const dkey = new Date(t.createdAt).toISOString().slice(0,10);
    if (dkey === todayKey) today_new++;
    const ts = +new Date(t.createdAt);
    if (Number.isFinite(ts) && ts >= cutoff) recentCount++;
  }

  const avg_per_day = Number((recentCount / Math.max(days,1)).toFixed(2));
  const completion_rate = total ? Number((done/total*100).toFixed(1)) : 0;
  const unresolved_rate = total ? Number((unresolved/total*100).toFixed(1)) : 0;
  const avg_unresolved_per_user = users.size ? Number((unresolved/users.size).toFixed(2)) : 0;

  return {
    // snake_case
    total, today_new, avg_per_day, completion_rate, unresolved_rate, avg_unresolved_per_user,
    // camelCase
    todayNew: today_new, avgPerDay: avg_per_day,
    completionRate: completion_rate, unresolvedRate: unresolved_rate,
    avgUnresolvedPerUser: avg_unresolved_per_user,
    // 互換キー（ダッシュボード実装違い対策）
    totalCount: total, todayCount: today_new
  };
}

export async function GET(req: Request) {
  try {
    const upstream = await proxyToFunc(req, "/api/tickets/stats/summary");
    if (upstream.ok) return upstream;
  } catch {}
  const url = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  const origin = url.origin;
  const body = await computeSummary(origin, days);
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type":"application/json; charset=utf-8" } });
}