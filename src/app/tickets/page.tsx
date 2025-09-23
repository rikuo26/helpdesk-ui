import Link from "next/link";
import { getTickets, type Ticket } from "@/lib/api";

function fmtJST(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(d);
}

export default async function Page() {
  const items = (await getTickets()) as Ticket[];
  return (
    <main style={{ padding: 24 }}>
      <h1>Tickets</h1>

      {items.length === 0 ? (
        <p>チケットはありません。</p>
      ) : (
        <ul>
          {items.map((t) => (
            <li key={t.id} style={{ marginBottom: 8 }}>
              <Link href={`/tickets/${t.id}`}>{t.title ?? t.id}</Link>
              {t.createdAt && <span style={{ marginLeft: 8, opacity: 0.7 }}>{fmtJST(t.createdAt)}</span>}
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 16 }}>
        <a href="/tickets/new" style={{ fontWeight: 600 }}>＋ 新規作成</a>
      </div>
    </main>
  );
}
