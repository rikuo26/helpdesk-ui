/** admin/tickets 専用: API 形状ゆらぎ → 正規化 ViewModel */
export type Norm = {
  totals: {
    totalCount: number; todayCount: number; avgPerDay: number;
    completionRate: number; unresolvedRate: number; wipRate: number;
    avgUnresolvedPerUser: number;
  };
  statusCounts: { open:number; in_progress:number; done:number; unresolved:number };
  daily: { labels:string[]; series:number[] };
  weekday: { labels:string[]; series:number[] };
  users: { name:string; count:number }[];
};

const num = (v:any, d=0)=> {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? Number(n) : d;
};
const get = (o:any, path:string[], d:any=undefined)=>{
  for (const p of path) {
    const segs = p.split(".");
    let cur = o;
    for (const s of segs) { if (cur && s in cur) cur = cur[s]; else { cur = undefined; break; } }
    if (cur !== undefined && cur !== null) return cur;
  }
  return d;
};

// users を配列化（usersChart などからの復元も）
function coerceUsers(src:any): { name:string; count:number }[] {
  if (Array.isArray(src?.users)) {
    const arr = src.users;
    if (Array.isArray(arr)) return arr.map((u:any)=>({ name: String(u.name ?? "unknown"), count: num(u.count ?? u.total, 0)}));
  }
  const chart = src?.usersChart ?? src?.data?.usersChart ?? src?.data?.stats?.usersChart;
  if (chart?.labels && chart?.data && Array.isArray(chart.labels) && Array.isArray(chart.data)) {
    return chart.labels.map((n:string, i:number)=>({ name:String(n), count:num(chart.data[i],0)}));
  }
  return [];
}

export function normalizeStats(raw:any): Norm {
  const src = raw?.data?.stats ?? raw?.stats ?? raw?.data ?? raw ?? {};

  // totals
  const totalCount = num(get(src, ["summary.totalCount","totalCount","total","totals.totalCount"],0),0);
  const todayCount = num(get(src, ["summary.todayCount","todayCount","today_new","todayNew"],0),0);
  const avgPerDay  = num(get(src, ["summary.avgPerDay","avgPerDay","avg_per_day"],0),0);
  const completionRate = num(get(src, ["summary.completionRate","completionRate","completion_rate"],0),0);
  const unresolvedRate = num(get(src, ["summary.unresolvedRate","unresolvedRate","unresolved_rate"],0),0);
  const wipRate = num(get(src, ["summary.wipRate","wipRate"],0),0);
  const avgUnresolvedPerUser = num(get(src, ["summary.avgUnresolvedPerUser","avgUnresolvedPerUser","avg_unresolved_per_user"],0),0);

  // status counts
  const sc = get(src, ["statusCounts","summary.statusCounts"], {});
  const statusCounts = {
    open        : num(sc?.open,0),
    in_progress : num(sc?.in_progress,0),
    done        : num(sc?.done,0),
    unresolved  : num(sc?.unresolved, num(sc?.open,0)+num(sc?.in_progress,0)) // fallback
  };

  // daily
  let dLabels = get(src, ["daily.labels"], []);
  let dSeries = get(src, ["daily.series","daily.data"], undefined);
  if (!Array.isArray(dSeries)) {
    const items = get(src, ["daily.items"], []);
    if (Array.isArray(items)) dSeries = items.map((i:any)=>num(i.count,0));
  }
  if (!Array.isArray(dLabels)) dLabels = [];
  if (!Array.isArray(dSeries)) dSeries = [];

  // weekday
  let wLabels = get(src, ["weekday.labels"], ["日","月","火","水","木","金","土"]);
  let wSeries = get(src, ["weekday.series","weekday.data"], []);
  if (!Array.isArray(wLabels)) wLabels = ["日","月","火","水","木","金","土"];
  if (!Array.isArray(wSeries)) wSeries = new Array(7).fill(0);

  // users
  let users = coerceUsers(raw) || coerceUsers(src);
  if (!Array.isArray(users)) users = [];

  return {
    totals: { totalCount, todayCount, avgPerDay, completionRate, unresolvedRate, wipRate, avgUnresolvedPerUser },
    statusCounts,
    daily: { labels: dLabels, series: dSeries },
    weekday: { labels: wLabels, series: wSeries },
    users
  };
}