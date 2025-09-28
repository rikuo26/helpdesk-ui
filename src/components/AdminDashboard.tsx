type Stats = {
  total?: number;
  newToday?: number;
  byStatus?: Record<string, number>;
  series?: { labels?: string[]; counts?: number[] };
};

type UserRow = { user: string; count: number };

export default async function AdminDashboard() {
  const [statsRaw, usersRaw] = await Promise.all([
    fetch(`/api/tickets/stats?days=14`, { cache: "no-store" }).then(r => r.ok ? r.json() : null),
    fetch(`/api/tickets/stats/users?days=14`, { cache: "no-store" }).then(r => r.ok ? r.json() : null),
  ]);

  // 型を絞る（null/不正は既定値にフォールバック）
  const stats: Stats = (statsRaw && typeof statsRaw === "object") ? statsRaw as Stats : {};
  const users: UserRow[] = Array.isArray(usersRaw) ? usersRaw as UserRow[] : [];

  const total    = Number(stats.total ?? 0);
  const newToday = Number(stats.newToday ?? 0);
  const byStatus = (stats.byStatus && typeof stats.byStatus === "object") ? stats.byStatus : {};
  const series   = stats.series ?? { labels: [] as string[], counts: [] as number[] };

  return (
    <section style={{padding:16}}>
      <h2>チケット ダッシュボード</h2>
      <ul>
        <li>総件数: {total}</li>
        <li>本日新規: {newToday}</li>
      </ul>

      {/* デバッグ出力（後でグラフUIに戻せます） */}
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