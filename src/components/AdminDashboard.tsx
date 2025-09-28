type Stats = {
  total?: number; newToday?: number;
  byStatus?: Record<string, number>;
  series?: { labels?: string[]; counts?: number[] };
};

export default async function AdminDashboard() {
  async function g<T>(u:string, fb:T){ try{ const r=await fetch(u,{cache:"no-store"}); return r.ok ? (await r.json() as T) : fb; }catch{ return fb; } }
  const [stats, users] = await Promise.all([
    g<Stats>("/api/tickets/stats?days=14", {}),
    g<any[]>("/api/tickets/stats/users?days=14", []),
  ]);

  const total    = Number(stats.total ?? 0);
  const newToday = Number(stats.newToday ?? 0);
  const byStatus = (stats.byStatus && typeof stats.byStatus==="object") ? stats.byStatus : {};
  const series   = stats.series ?? { labels:[], counts:[] };

  return (
    <section style={{display:"grid", gap:16}}>
      <div style={{display:"flex", gap:16}}>
        <div style={{padding:12,border:"1px solid #eee",borderRadius:8,minWidth:140}}>
          <div style={{fontSize:12,color:"#6b7280"}}>総件数</div>
          <div style={{fontSize:24,fontWeight:600}}>{total}</div>
        </div>
        <div style={{padding:12,border:"1px solid #eee",borderRadius:8,minWidth:140}}>
          <div style={{fontSize:12,color:"#6b7280"}}>本日新規</div>
          <div style={{fontSize:24,fontWeight:600}}>{newToday}</div>
        </div>
        <div style={{padding:12,border:"1px solid #eee",borderRadius:8,flex:1}}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>ステータス内訳</div>
          <div style={{fontSize:14}}>
            {Object.keys(byStatus).length
              ? Object.entries(byStatus).map(([k,v])=>`${k}:${v}`).join(" / ")
              : "—"}
          </div>
        </div>
      </div>

      <div style={{border:"1px solid #eee",borderRadius:8,padding:12}}>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>直近の推移</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(14,1fr)",gap:6,alignItems:"end"}}>
          {(series.counts ?? []).map((c,i)=>(
            <div key={i} title={`${series.labels?.[i] ?? ""}: ${c}`} style={{height:Math.max(4, Math.min(60, Number(c||0)*6)), background:"#60a5fa"}} />
          ))}
        </div>
      </div>

      <details>
        <summary>ユーザー別集計</summary>
        <pre suppressHydrationWarning>{JSON.stringify(users,null,2)}</pre>
      </details>
    </section>
  );
}