export default async function AdminDashboard() {
  const [stats, users] = await Promise.all([
    fetch(`/api/tickets/stats?days=14`, { cache: "no-store" }).then(r => r.ok ? r.json() : {}),
    fetch(`/api/tickets/stats/users?days=14`, { cache: "no-store" }).then(r => r.ok ? r.json() : []),
  ]);

  const total     = Number(stats?.total)    || 0;
  const newToday  = Number(stats?.newToday) || 0;
  const byStatus  = (stats && typeof stats.byStatus === "object") ? stats.byStatus : {};
  const series    = stats?.series ?? { labels: [], counts: [] };

  return (
    <section style={{padding:16}}>
      <h2>チケット ダッシュボード</h2>
      <ul>
        <li>総件数: {total}</li>
        <li>本日新規: {newToday}</li>
      </ul>
      {/* デバッグ出力（最低限の可視化）。後で既存UIに戻せます */}
      <details open style={{marginTop:12}}>
        <summary>status / series</summary>
        <pre suppressHydrationWarning>{JSON.stringify({ byStatus, series }, null, 2)}</pre>
      </details>
      <details style={{marginTop:12}}>
        <summary>users</summary>
        <pre suppressHydrationWarning>{JSON.stringify(users, null, 2)}</pre>
      </details>
    </section>
  );
}