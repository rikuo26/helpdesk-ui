import { NextRequest, NextResponse } from "next/server";
import { list, type Ticket } from "../../_db";

export const runtime = "nodejs";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

/** GET /api/tickets/stats?granularity=day|month&days=14&months=6 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const granularity = (searchParams.get("granularity") ?? "day") as "day"|"month";

  const items: Ticket[] = list("all");
  const total = items.length;

  // 今日件数（表示用KPI）
  const today0 = startOfDay();
  const today = items.filter(t => startOfDay(new Date(t.createdAt ?? Date.now())).getTime() === today0.getTime()).length;

  // ステータス別
  const statusCounts: Record<string, number> = {};
  for (const t of items) {
    const s = t.status ?? "open";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  // owner別Top5
  const ownerCounts: Record<string, number> = {};
  for (const t of items) {
    const o = t.owner ?? "unknown";
    ownerCounts[o] = (ownerCounts[o] ?? 0) + 1;
  }
  const owners = Object.entries(ownerCounts)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([name, value]) => ({ name, value }));

  if (granularity === "month") {
    const months = Math.max(1, Math.min(24, Number(searchParams.get("months") ?? 6)));
    const mapByMonth: Record<string, number> = {};
    for (const t of items) {
      const d = new Date(t.createdAt ?? Date.now());
      const key = ymKey(d);
      mapByMonth[key] = (mapByMonth[key] ?? 0) + 1;
    }
    const series: { date: string; count: number }[] = [];
    // 現在月からさかのぼる
    const cur = new Date();
    cur.setDate(1);
    for (let i = months-1; i >= 0; i--) {
      const d = new Date(cur.getFullYear(), cur.getMonth()-i, 1);
      const key = ymKey(d);
      series.push({ date: key, count: mapByMonth[key] ?? 0 });
    }
    return NextResponse.json({ total, today, statusCounts, owners, series }, { status: 200 });
  }

  // 日次
  const days = Math.max(1, Math.min(180, Number(searchParams.get("days") ?? 14)));
  const mapByDay: Record<string, number> = {};
  for (const t of items) {
    const d = startOfDay(new Date(t.createdAt ?? Date.now()));
    const key = d.toISOString().slice(0,10);
    mapByDay[key] = (mapByDay[key] ?? 0) + 1;
  }
  const series: { date: string; count: number }[] = [];
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    series.push({ date: key.slice(5), count: mapByDay[key] ?? 0 });
  }
  return NextResponse.json({ total, today, statusCounts, owners, series }, { status: 200 });
}
