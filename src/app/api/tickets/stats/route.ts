export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ticket = { id:number; createdAt:string; createdBy?:string|null; status?:string|null };
const toInt = (v:any, d:number)=>{ const n = Number(v); return Number.isFinite(n)?n:d; };

async function computeAll(origin:string, days:number){
  const r = await fetch(`${origin}/api/tickets?scope=all`, { cache:"no-store" });
  const list = (await r.json()) as Ticket[];

  const total = list.length;
  const todayKey = new Date().toISOString().slice(0,10);

  let today_new = 0;
  let open = 0, in_progress = 0, done = 0, unresolved = 0;

  const usersMap = new Map<string, number>();

  const today = new Date(); today.setUTCHours(0,0,0,0);
  const labels:string[] = [];
  const counts:Record<string,number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setUTCDate(today.getUTCDate() - i);
    const key = d.toISOString().slice(0,10);
    labels.push(key); counts[key] = 0;
  }

  const weekdayLabels = ["日","月","火","水","木","金","土"];
  const weekdayCounts = Array(7).fill(0);

  const cutoff = Date.now() - days*86400000;
  let recentCount = 0;

  for (const t of list) {
    const st = (t.status ?? "open").toLowerCase();
    if (st === "done") { done++; }
    else if (st === "in_progress" || st === "wip") { in_progress++; unresolved++; }
    else { open++; unresolved++; }

    const user = (t.createdBy ?? "unknown") + "";
    usersMap.set(user, (usersMap.get(user) ?? 0) + 1);

    const d = new Date(t.createdAt);
    const key = d.toISOString().slice(0,10);
    if (key === todayKey) today_new++;
    if (key in counts) counts[key]++;

    const ts = +d;
    if (Number.isFinite(ts) && ts >= cutoff) {
      recentCount++;
      const wd = d.getUTCDay();
      weekdayCounts[wd]++;
    }
  }

  const users = [...usersMap.entries()]
    .map(([name,count]) => ({ name, count, total: count }))
    .sort((a,b)=>b.count-a.count)
    .slice(0,10);

  const dailySeries = labels.map(k=>counts[k] ?? 0);

  const avg_per_day = Number((recentCount / Math.max(days,1)).toFixed(2));
  const completion_rate = total ? Number((done/total*100).toFixed(1)) : 0;
  const unresolved_rate = total ? Number((unresolved/total*100).toFixed(1)) : 0;
  const wip_rate = total ? Number((in_progress/total*100).toFixed(1)) : 0;
  const avg_unresolved_per_user = usersMap.size ? Number((unresolved/usersMap.size).toFixed(2)) : 0;

  const payload = {
    // ---- flat ----
    total, totalCount: total,
    today_new, todayNew: today_new, todayCount: today_new,
    avg_per_day, avgPerDay: avg_per_day,
    completion_rate, completionRate: completion_rate,
    unresolved_rate, unresolvedRate: unresolved_rate,
    avg_unresolved_per_user, avgUnresolvedPerUser: avg_unresolved_per_user,
    wipRate: wip_rate,

    // ---- nested for UI ----
    summary: {
      totalCount: total,
      todayCount: today_new,
      avgPerDay: avg_per_day,
      completionRate: completion_rate,
      unresolvedRate: unresolved_rate,
      avgUnresolvedPerUser: avg_unresolved_per_user,
      wipRate: wip_rate,
      statusCounts: { open, in_progress, done, unresolved }
    },

    statusCounts: { open, in_progress, done, unresolved },

    daily: {
      labels,
      items: labels.map(k => ({ date: k, count: counts[k] })),
      series: dailySeries,
      data: dailySeries
    },

    weekday: {
      labels: weekdayLabels,
      series: weekdayCounts,
      data: weekdayCounts
    },

    users,
    usersChart: {
      labels: users.map(u => u.name),
      series: users.map(u => u.count),
      data: users.map(u => u.count)
    }
  };

  // 互換のために3系統で返す（トップ / data / data.stats）
  return {
    ...payload,
    stats: payload,
    data: { ...payload, stats: payload }
  };
}

export async function GET(req: Request) {
  try {
    const upstream = await proxyToFunc(req, "/api/tickets/stats");
    if (upstream.ok) return upstream;
  } catch {}
  const url = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  const origin = url.origin;
  const result = await computeAll(origin, days);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type":"application/json; charset=utf-8" }
  });
}