type Ticket = {
  id: string; title: string; description?: string | null;
  status: string; createdAt: string; createdBy?: string | null;
};

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(path, { cache: "no-store" });
    if (!r.ok) return fallback;
    return await r.json();
  } catch {
    return fallback;
  }
}

import StatusQuickEdit from "@/components/StatusQuickEdit";

export default async function AdminTicketsPage() {
  const [list, stats, users] = await Promise.all([
    getJson<Ticket[]>("/api/tickets?scope=all", []),
    getJson<any>("/api/tickets/stats?days=14", null),
    getJson<any[]>("/api/tickets/stats/users?days=14", []),
  ]);

  const total    = Number(stats?.total ?? list.length ?? 0);
  const newToday = Number(stats?.newToday ?? 0);
  const byStatus: Record<string,number> =
    (stats?.byStatus && typeof stats.byStatus === "object") ? stats.byStatus : {};

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>チケット管理</h1>

      <section style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div>総件数: <strong>{total}</strong></div>
        <div>本日新規: <strong>{newToday}</strong></div>
        <div>
          ステータス内訳:{" "}
          {Object.keys(byStatus).length
            ? Object.entries(byStatus).map(([k,v]) => `${k}:${v}`).join(", ")
            : "—"}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>件名</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>状態</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>作成日時</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>作成者</th>
            </tr>
          </thead>
          <tbody>
            {list.map(t => (
              <tr key={t.id}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{t.id}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{t.title}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  <StatusQuickEdit id={t.id} value={t.status} />
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                  {new Date(t.createdAt).toLocaleString("ja-JP", { hour12: false })}
                </td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{t.createdBy ?? "—"}</td>
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={5} style={{ padding: 12, color: "#666" }}>データがありません</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 24 }}>
        <details>
          <summary>ユーザー別集計</summary>
          <pre suppressHydrationWarning>{JSON.stringify(users, null, 2)}</pre>
        </details>
      </section>
    </main>
  );
}