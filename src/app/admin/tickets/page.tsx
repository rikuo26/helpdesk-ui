import TicketsGrid from "@/components/TicketsGrid";
import { apiFetch } from "@/lib/api";

type Stats = { total:number; newToday:number; byStatus:Record<string,number>; series:{ labels:string[]; counts:number[] } };

function Sparkline({ counts }: { counts:number[] }) {
  const w = 160, h = 36, p = 2;
  const xs = counts.length ? counts : [0];
  const max = Math.max(...xs, 1);
  const step = (w - p*2) / (xs.length - 1 || 1);
  const pts = xs.map((v,i)=>`${p + i*step},${h - p - (v/max)*(h - p*2)}`).join(" ");
  return <svg width={w} height={h}><polyline fill="none" stroke="#2563eb" strokeWidth="2" points={pts} /></svg>;
}

export default async function AdminTicketsPage() {
  const [stats, users] = await Promise.all([
    apiFetch<Stats>("/tickets/stats?days=14"),
    apiFetch<any[]>("/tickets/stats/users?days=14"),
  ]);

  return (
    <main style={{ padding: 16, display:"grid", gap:16 }}>
      <h1 style={{ fontSize:20, fontWeight:600 }}>チケット管理</h1>

      <section style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(0,1fr))", gap:12 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12 }}>総件数</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{stats?.total ?? 0}</div>
        </div>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12 }}>本日新規</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{stats?.newToday ?? 0}</div>
        </div>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12 }}>14日スパークライン</div>
          <Sparkline counts={stats?.series?.counts ?? []} />
        </div>
      </section>

      <section>
        <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>ステータス内訳</div>
        <div>
          {Object.entries(stats?.byStatus || {}).map(([k,v]) => (
            <span key={k} style={{ marginRight:12 }}>{k}: <strong>{v}</strong></span>
          ))}
          {!Object.keys(stats?.byStatus || {}).length && <span>—</span>}
        </div>
      </section>

      <section>
        <TicketsGrid scope="all" />
      </section>

      <details><summary>ユーザー別集計</summary>
        <pre suppressHydrationWarning>{JSON.stringify(users, null, 2)}</pre>
      </details>
    </main>
  );
}