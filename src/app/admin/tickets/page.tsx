import TicketsGrid from "@/components/TicketsGrid";
import { apiGet } from "@/lib/api";
import CsvButtons from "@/components/CsvButtons";
import SimpleLineChart from "@/components/charts/SimpleLineChart";
import SimpleDonutChart from "@/components/charts/SimpleDonutChart";
import SimpleBarChart from "@/components/charts/SimpleBarChart";

type Stats = { total:number; newToday:number; byStatus:Record<string,number>; series?:{ labels:string[]; counts:number[] } };
type UsersRow = { owner?:string; name?:string; total?:number; open?:number; in_progress?:number; done?:number };

// Next 15/14 両対応: searchParams が Promise の場合とオブジェクトの場合を吸収
async function normSearchParams(raw: any): Promise<Record<string, any>> {
  if (raw && typeof raw.then === "function") return (await raw) ?? {};
  return raw ?? {};
}

export default async function AdminTicketsPage(props: any) {
  const sp = await normSearchParams(props?.searchParams);
  const daysStr = Array.isArray(sp.days) ? sp.days[0] : sp.days;
  const days = Math.max(1, Math.min(90, Number(daysStr) || 14));

  const [stats, users] = await Promise.all([
    apiGet<Stats>(`/tickets/stats?days=${days}`, { fallback: { total:0, newToday:0, byStatus:{}, series:{ labels:[], counts:[] } } }),
    apiGet<UsersRow[]>(`/tickets/stats/users?days=${days}`, { fallback: [] }),
  ]);

  const open = stats.byStatus?.open ?? 0;
  const prog = stats.byStatus?.in_progress ?? 0;
  const done = stats.byStatus?.done ?? 0;
  const unresolved = open + prog;
  const closedRate = stats.total ? Math.round((done / stats.total) * 100) : 0;
  const unresolvedRate = stats.total ? Math.round((unresolved / stats.total) * 100) : 0;
  const wipRate = unresolved ? Math.round((prog / unresolved) * 100) : 0;

  const avgPerDay = stats.series?.counts?.length
    ? Math.round(stats.series.counts.reduce((a,b)=>a+b,0) / stats.series.counts.length)
    : 0;

  const activeOwners = users.filter(u => (u.total ?? 0) > 0).length || 1;
  const avgHoldingPerOwner = Math.round(((unresolved) / activeOwners) * 10) / 10;

  const topUsers = [...users]
    .map(u => ({ label: (u.name || u.owner || "—").slice(0,6), value: u.total ?? 0 }))
    .sort((a,b)=>b.value-a.value)
    .slice(0,5);

  // 曜日分布（期間内新規）
  const wd = Array(7).fill(0) as number[];
  (stats.series?.labels ?? []).forEach((d, i) => {
    const dt = new Date(`${d}T00:00:00`);
    const idx = isNaN(dt.getTime()) ? 0 : dt.getDay();
    wd[idx] += stats.series?.counts?.[i] ?? 0;
  });
  const wdLabels = ["日","月","火","水","木","金","土"];

  const periods = [7,14,30,90];

  return (
    <main style={{ padding: 16, display:"grid", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1 style={{ fontSize:20, fontWeight:600 }}>チケット管理</h1>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ display:"flex", gap:6 }}>
            {periods.map(p => (
              <a key={p} href={`?days=${p}`} style={{
                padding:"6px 10px",
                border:"1px solid #e5e7eb", borderRadius:6,
                background: p===days ? "#eff6ff" : "#fff",
                color: p===days ? "#1d4ed8" : "#0f172a",
                textDecoration:"none"
              }}>{p}日</a>
            ))}
          </div>
          <CsvButtons days={days} />
        </div>
      </div>

      {/* KPI */}
      <section style={{ display:"grid", gridTemplateColumns:"repeat(6, minmax(0,1fr))", gap:12 }}>
        <Kpi label="総件数（現在）" value={stats.total} />
        <Kpi label="本日新規" value={stats.newToday} />
        <Kpi label={`${days}日平均/日`} value={avgPerDay} />
        <Kpi label="完了率" value={`${closedRate}%`} />
        <Kpi label="未解決率" value={`${unresolvedRate}%`} />
        <Kpi label="担当者あたり保有（平均）" value={avgHoldingPerOwner} />
      </section>

      {/* ステータス内訳 + 推移 */}
      <section style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:16 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>ステータス内訳</div>
          <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", alignItems:"center", gap:8 }}>
            <SimpleDonutChart items={[{label:"open", value: open}, {label:"in_progress", value: prog}, {label:"done", value: done}]} />
            <div style={{ display:"grid", gap:4 }}>
              <Row label="open" v={open} />
              <Row label="in_progress" v={prog} />
              <Row label="done" v={done} />
              <Row label="WIP比率" v={`${wipRate}%`} />
            </div>
          </div>
        </div>

        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>件数推移（{days}日）</div>
          <SimpleLineChart data={stats.series?.counts ?? []} labels={stats.series?.labels ?? []} height={180} />
        </div>
      </section>

      {/* 曜日分布 / トップ担当者 */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>曜日分布（期間内の新規）</div>
          <div style={{ display:"flex", gap:8, alignItems:"end" }}>
            {wd.map((v, i) => (
              <div key={i} style={{ textAlign:"center", width:36 }}>
                <div style={{ height:100, display:"flex", alignItems:"end", justifyContent:"center" }}>
                  <div title={`${wdLabels[i]}: ${v}`} style={{ width:20, height: Math.max(2, Math.round((v/Math.max(...wd,1))*100)) , background:"#93c5fd", borderRadius:4 }} />
                </div>
                <div style={{ fontSize:12, marginTop:4, color:"#475569" }}>{wdLabels[i]}</div>
                <div style={{ fontSize:12 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>トップ担当者（{days}日・総数）</div>
          <SimpleBarChart rows={topUsers} height={200} />
        </div>
      </section>

      {/* 一覧 */}
      <section>
        <TicketsGrid scope="all" />
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label:string; value: number|string }) {
  return (
    <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
      <div style={{ color:"#64748b", fontSize:12 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700 }}>{value}</div>
    </div>
  );
}
function Row({ label, v }: { label: string; v: number|string }) {
  return <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:"#475569" }}>{label}</span><b>{v}</b></div>;
}