export const runtime = "nodejs";

// 統計は Next 側で集計。チケット一覧の取得は /api/proxy-tickets に委譲する
type Ticket = { id:number; createdAt:any; createdBy?:string|null; status?:string|null };

const toInt = (v:any, d:number)=>{ const n = Number(v); return Number.isFinite(n)?n:d; };

// どんな文字列/数値でも Date へ（失敗は null）
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

const n0 = (v:any)=> Number.isFinite(+v) ? +v : 0;

async function getAllTicketsViaProxy(req: Request): Promise<Ticket[]> {
  const rid = Math.random().toString(36).slice(2);
  const origin = new URL(req.url).origin;
  const url = `${origin}/api/proxy-tickets?scope=all`;

  console.log(`[stats][${rid}] fetch:`, url);
  const res = await fetch(url, { cache: "no-store" });
  const textHead = () => res.text().then(t => t.slice(0, 300)).catch(()=> "");

  if (!res.ok) {
    console.error(`[stats][${rid}] proxy-tickets failed: ${res.status}`, await textHead());
    throw new Error(`proxy-tickets failed: ${res.status}`);
  }
  const data = await res.json().catch(() => ([]));
  const arr = Array.isArray(data) ? data : [];
  console.log(`[stats][${rid}] tickets:`, arr.length);
  return arr as Ticket[];
}

async function computeAll(req: Request, days:number){
  const list = await getAllTicketsViaProxy(req);

  const total = list.length;
  const todayUTC = new Date(); todayUTC.setUTCHours(0,0,0,0);
  const todayKey = todayUTC.toISOString().slice(0,10);

  let today_new = 0;
  let open = 0, in_progress = 0, done = 0, unresolved = 0;

  const usersMap = new Map<string, number>();

  const labels:string[] = [];
  const counts:Record<string,number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayUTC); d.setUTCDate(todayUTC.getUTCDate() - i);
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

    const d = parseDate(t.createdAt);
    if (!d) continue;
    const key = d.toISOString().slice(0,10);
    if (key === todayKey) today_new++;
    if (key in counts) counts[key]++;

    const ts = +d;
    if (Number.isFinite(ts) && ts >= cutoff) {
      recentCount++;
      const wd = d.getUTCDay();
      if (wd >= 0 && wd <= 6) weekdayCounts[wd]++;
    }
  }

  const users = [...usersMap.entries()]
    .map(([name,count]) => ({ name, count, total: count }))
    .sort((a,b)=>b.count-a.count)
    .slice(0,10);

  const dailySeries = labels.map(k=>n0(counts[k]));

  const avg_per_day = Number((n0(recentCount) / Math.max(days,1)).toFixed(2));
  const completion_rate  = total ? Number((n0(done)/total*100).toFixed(1)) : 0;
  const unresolved_rate  = total ? Number((n0(unresolved)/total*100).toFixed(1)) : 0;
  const wip_rate         = total ? Number((n0(in_progress)/total*100).toFixed(1)) : 0;
  const avg_unresolved_per_user = usersMap.size ? Number((n0(unresolved)/usersMap.size).toFixed(2)) : 0;

  const payload = {
    total, totalCount: total,
    today_new, todayNew: today_new, todayCount: today_new,
    avg_per_day, avgPerDay: avg_per_day,
    completion_rate, completionRate: completion_rate,
    unresolved_rate, unresolvedRate: unresolved_rate,
    avg_unresolved_per_user, avgUnresolvedPerUser: avg_unresolved_per_user,
    wipRate: wip_rate,

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

    daily:   { labels, items: labels.map(k => ({ date: k, count: n0(counts[k]) })), series: dailySeries, data: dailySeries },
    weekday: { labels: weekdayLabels, series: weekdayCounts, data: weekdayCounts },

    users,
    usersChart: { labels: users.map(u => u.name), series: users.map(u => n0(u.count)), data: users.map(u => n0(u.count)) }
  };

  return { ...payload, stats: payload, data: { ...payload, stats: payload } };
}

export async function GET(req: Request) {
  const url  = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  try {
    const result = await computeAll(req, days);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "content-type":"application/json; charset=utf-8" }
    });
  } catch (e:any) {
    console.error("[stats] failed:", e?.message ?? e);
    return new Response(JSON.stringify({ error: e?.message ?? "stats-failed" }), { status: 500 });
  }
}