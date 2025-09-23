import { getTicket } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTicket(id);

  return (
    <main style={{ padding: 24 }}>
      <h1>Ticket Detail</h1>
      <p>ID: {id}</p>

      {data ? (
        <>
          <h2 style={{ marginTop: 16 }}>{data.title}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{data.description}</p>
          {data.createdAt && (
            <p style={{ opacity: 0.7, marginTop: 8 }}>作成: {data.createdAt}</p>
          )}
        </>
      ) : (
        <p style={{ opacity: 0.7, marginTop: 16 }}>
          ※ 詳細APIが未実装か、該当IDが存在しません（簡易フォールバックでも見つかりませんでした）。
        </p>
      )}
    </main>
  );
}
