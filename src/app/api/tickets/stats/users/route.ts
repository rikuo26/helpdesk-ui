export const runtime = "nodejs";

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

async function getAllTicketsViaProxy(req: Request): Promise<Ticket[]> {
  const rid = Math.random().toString(36).slice(2);
  const origin = new URL(req.url).origin;
  const url = `${origin}/api/proxy-tickets?scope=all`;
  console.log(`[stats-users][${rid}] fetch:`, url);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error(`[stats-users][${rid}] proxy-tickets failed: ${res.status}`);
    throw new Error(`proxy-tickets failed: ${res.status}`);
  }
  const data = await res.json().catch(() => ([]));
  return Array.isArray(data) ? (data as Ticket[]) : [];
}

export async function GET(req: Request) {
  const url  = new URL(req.url);
  const days = toInt(url.searchParams.get("days"), 14);
  const cutoff = Date.now() - days*86400000;

  try {
    const list = await getAllTicketsViaProxy(req);
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

    const full = { items, labels: items.map(i=>i.name), data: items.map(i=>i.count) };
    const shape = (url.searchParams.get("shape") ?? "").toLowerCase();
    const payload = (shape === "full" || shape === "1") ? full : items;

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type":"application/json; charset=utf-8" }
    });
  } catch (e:any) {
    console.error("[stats-users] failed:", e?.message ?? e);
    return new Response(JSON.stringify({ error: e?.message ?? "stats-users-failed" }), { status: 500 });
  }
}