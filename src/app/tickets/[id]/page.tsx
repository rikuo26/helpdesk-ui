import { getTicket } from "@/lib/api";

type Ticket = {
  id: string;
  title?: string;
  description?: string | null;
  status?: string;
  createdAt?: string;
  createdBy?: string | null;
};

async function normParams(raw: any): Promise<Record<string, any>> {
  if (raw && typeof raw.then === "function") return (await raw) ?? {};
  return raw ?? {};
}

export default async function TicketDetailPage(props: any) {
  const p = await normParams(props?.params);
  const id = String(p?.id ?? "");
  const raw = id ? await getTicket(id).catch(() => null) : null;
  const t: Ticket | null = raw && typeof raw === "object" ? (raw as Ticket) : null;

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>チケット詳細</h1>

      {!t ? (
        <p style={{ marginTop: 8, color: "#666" }}>
          チケットが見つかりませんでした。URL または権限をご確認ください。
        </p>
      ) : (
        <>
          <h2 style={{ marginTop: 16 }}>{t.title ?? "(無題)"}</h2>
          {t.description && (
            <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{t.description}</p>
          )}
          {t.createdAt && (
            <p style={{ opacity: 0.7, marginTop: 8 }}>
              作成: {new Date(t.createdAt).toLocaleString("ja-JP", { hour12: false })}
            </p>
          )}
        </>
      )}
    </main>
  );
}