import TicketsGrid from "@/components/TicketsGrid";
import { apiGet } from "@/lib/api";
import SimpleLineChart from "@/components/charts/SimpleLineChart";
import SimpleDonutChart from "@/components/charts/SimpleDonutChart";
import SimpleBarChart from "@/components/charts/SimpleBarChart";

type Stats = {
  total: number;
  newToday: number;
  byStatus: Record<string, number>;
  series?: { labels: string[]; counts: number[] };
};
type UsersRow = { owner?: string; name?: string; total?: number; open?: number; in_progress?: number; done?: number };

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

  const topUsers = [...users]
    .map(u => ({ label: (u.name || u.owner || "—").slice(0,6), value: u.total ?? 0 }))
    .sort((a,b)=>b.value-a.value)
    .slice(0,5);

  const donutItems = [
    { label: "open", value: open },
    { label: "in_progress", value: prog },
    { label: "done", value: done },
  ];

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

      {/* チャート群 */}
      <section style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:16 }}>
        {/* 左: ステータス内訳（ドーナツ） */}
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>ステータス内訳</div>
          <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", alignItems:"center" }}>
            <SimpleDonutChart items={donutItems} />
            <div style={{ display:"grid", gap:4 }}>
              {donutItems.map((d,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"#475569" }}>{d.label}</span>
                  <b>{d.value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右: 14日推移（折れ線） */}
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>件数推移（14日）</div>
          <SimpleLineChart data={stats.series?.counts ?? []} height={160} />
        </div>
      </section>

      {/* 下段: トップ担当者（棒） */}
      <section style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
        <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>トップ担当者（14日）</div>
        <SimpleBarChart rows={topUsers} height={200} />
      </section>

      {/* 一覧 */}
      <section>
        <TicketsGrid scope="all" />
      </section>
    </main>
  );
}