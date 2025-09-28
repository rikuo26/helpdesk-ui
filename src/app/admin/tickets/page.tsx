import { toArray, valuesToArray, sum } from "./stats-utils";

export default async function AdminTicketsPage() {
  const base = "";
  const [stats, users] = await Promise.all([
    fetch(`${base}/api/tickets/stats?days=14`, { cache: "no-store" }).then(r=>r.json()),
    fetch(`${base}/api/tickets/stats/users?days=14`, { cache: "no-store" }).then(r=>r.json()),
  ]);

  const labels = toArray<string>(stats?.series?.labels);
  const counts = toArray<number>(stats?.series?.counts);
  const byStatus = valuesToArray(stats?.byStatus);
  const totalByStatus = sum(byStatus);

  return (
    <main style={{padding:24}}>
      <h1>チケット ダッシュボード</h1>
      <ul>
        <li>総件数: {Number(stats?.total)||0}</li>
        <li>本日新規: {Number(stats?.newToday)||0}</li>
        <li>ステータス合計: {totalByStatus}</li>
      </ul>
      <pre>{JSON.stringify({ labels, counts }, null, 2)}</pre>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </main>
  );
}
