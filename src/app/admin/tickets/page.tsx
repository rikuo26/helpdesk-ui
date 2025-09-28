import TicketsGrid from "@/components/TicketsGrid";
import { apiGet } from "@/lib/api";

type Stats = {
  total: number;
  newToday: number;
  byStatus: Record<string, number>;
  series?: { labels: string[]; counts: number[] };
};
type UsersRow = { owner?: string; name?: string; total?: number; open?: number; in_progress?: number; done?: number };

function Sparkline({ counts }: { counts: number[] }) {
  const w = 180, h = 40, p = 2;
  const xs = counts.length ? counts : [0];
  const max = Math.max(...xs, 1);
  const step = (w - p*2) / (xs.length - 1 || 1);
  const pts = xs.map((v,i)=>`${p + i*step},${h - p - (v/max)*(h - p*2)}`).join(" ");
  return <svg width={w} height={h}><polyline fill="none" stroke="#2563eb" strokeWidth="2" points={pts} /></svg>;
}

export default async function AdminTicketsPage() {
  const [stats, users] = await Promise.all([
    apiGet<Stats>("/tickets/stats?days=14", { fallback: { total:0, newToday:0, byStatus:{}, series:{ labels:[], counts:[] } } }),
    apiGet<UsersRow[]>("/tickets/stats/users?days=14", { fallback: [] }),
  ]);

  const open = stats.byStatus?.open ?? 0;
  const prog = stats.byStatus?.in_progress ?? 0;
  const done = stats.byStatus?.done ?? 0;
  const closedRate = stats.total ? Math.round((done / stats.total) * 100) : 0;
  const avgPerDay = stats.series?.counts?.length
    ? Math.round(stats.series.counts.reduce((a,b)=>a+b,0) / stats.series.counts.length)
    : 0;

  const topUsers = [...users].sort((a,b)=>(b.total??0)-(a.total??0)).slice(0,5);

  return (
    <main style={{ padding: 16, display:"grid", gap:16 }}>
      <h1 style={{ fontSize:20, fontWeight:600 }}>チケット管理</h1>

      {/* KPI */}
      <section style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12 }}>総件数</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{stats.total}</div>
        </div>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12 }}>本日新規</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{stats.newToday}</div>
        </div>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12 }}>14日平均/日</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{avgPerDay}</div>
        </div>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12 }}>完了率</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{closedRate}%</div>
        </div>
      </section>

      {/* ステータス内訳 + スパークライン */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 200px", gap:12 }}>
        <div>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>ステータス内訳</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <span style={{ padding:"4px 8px", border:"1px solid #e5e7eb", borderRadius:999 }}>open: <b>{open}</b></span>
            <span style={{ padding:"4px 8px", border:"1px solid #e5e7eb", borderRadius:999 }}>in_progress: <b>{prog}</b></span>
            <span style={{ padding:"4px 8px", border:"1px solid #e5e7eb", borderRadius:999 }}>done: <b>{done}</b></span>
          </div>
        </div>
        <div>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>14日スパークライン</div>
          <Sparkline counts={stats.series?.counts ?? []} />
        </div>
      </section>

      {/* トップ担当者 */}
      <section>
        <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>トップ担当者（14日）</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>担当</th>
              <th style={{ textAlign:"right", borderBottom:"1px solid #ddd", padding:8 }}>総数</th>
              <th style={{ textAlign:"right", borderBottom:"1px solid #ddd", padding:8 }}>open</th>
              <th style={{ textAlign:"right", borderBottom:"1px solid #ddd", padding:8 }}>in_progress</th>
              <th style={{ textAlign:"right", borderBottom:"1px solid #ddd", padding:8 }}>done</th>
            </tr>
          </thead>
          <tbody>
            {topUsers.map((r,i)=>(
              <tr key={i}>
                <td style={{ borderBottom:"1px solid #eee", padding:8 }}>{r.name || r.owner || "—"}</td>
                <td style={{ borderBottom:"1px solid #eee", padding:8, textAlign:"right" }}>{r.total ?? 0}</td>
                <td style={{ borderBottom:"1px solid #eee", padding:8, textAlign:"right" }}>{r.open ?? 0}</td>
                <td style={{ borderBottom:"1px solid #eee", padding:8, textAlign:"right" }}>{r.in_progress ?? 0}</td>
                <td style={{ borderBottom:"1px solid #eee", padding:8, textAlign:"right" }}>{r.done ?? 0}</td>
              </tr>
            ))}
            {!topUsers.length && <tr><td colSpan={5} style={{ padding:12, color:"#666" }}>データがありません</td></tr>}
          </tbody>
        </table>
      </section>

      {/* 一覧 */}
      <section>
        <TicketsGrid scope="all" />
      </section>
    </main>
  );
}