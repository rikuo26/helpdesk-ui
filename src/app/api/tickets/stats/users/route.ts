import { NextRequest, NextResponse } from "next/server";
import { list, type Ticket } from "../../../_db";

export const runtime = "nodejs";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

type Row = {
  owner: string;
  total: number;
  open: number;
  investigating: number;
  waiting: number;
  in_progress: number;
  done: number;
};

function filterByRange(items: Ticket[], granularity: "day"|"month", days: number, months: number) {
  if (granularity === "month") {
    const from = new Date(); from.setMonth(from.getMonth() - (months - 1)); from.setDate(1); from.setHours(0,0,0,0);
    return items.filter(t => {
      const d = new Date(t.createdAt ?? Date.now());
      const cmp = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return cmp >= from.getTime();
    });
  }
  // day
  const from = new Date(); from.setDate(from.getDate() - (days - 1)); from.setHours(0,0,0,0);
  return items.filter(t => startOfDay(new Date(t.createdAt ?? Date.now())).getTime() >= from.getTime());
}

/** GET /api/tickets/stats/users?granularity=day|month&days=14&months=6&format=json|csv */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const granularity = (searchParams.get("granularity") ?? "day") as "day"|"month";
  const days = Math.max(1, Math.min(180, Number(searchParams.get("days") ?? 14)));
  const months = Math.max(1, Math.min(24, Number(searchParams.get("months") ?? 6)));
  const format = (searchParams.get("format") ?? "json").toLowerCase();

  const all = list("all");
  const items = filterByRange(all, granularity, days, months);

  const map = new Map<string, Row>();
  function rowFor(owner: string) {
    if (!map.has(owner)) {
      map.set(owner, { owner, total: 0, open: 0, investigating: 0, waiting: 0, in_progress: 0, done: 0 });
    }
    return map.get(owner)!;
  }

  for (const t of items) {
    const owner = t.owner ?? "unknown";
    const r = rowFor(owner);
    r.total += 1;
    const s = (t.status ?? "open") as keyof Omit<Row,"owner"|"total">;
    if (r[s] !== undefined) (r as any)[s] += 1;
  }

  const rows = Array.from(map.values()).sort((a,b)=>b.total - a.total);

  if (format === "csv") {
    const header = ["owner","total","open","investigating","waiting","in_progress","done"];
    const lines = [header.join(",")].concat(
      rows.map(r => [r.owner,r.total,r.open,r.investigating,r.waiting,r.in_progress,r.done].join(","))
    );
    const csv = lines.join("\r\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ticket_users_report_${granularity}.csv"`
      }
    });
  }

  return NextResponse.json({ granularity, range: granularity==="day" ? days : months, rows }, { status: 200 });
}
