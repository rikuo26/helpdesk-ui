export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin: Ticket</h1>
      <p>ID: {id}</p>
      <p style={{ opacity: 0.7 }}>※ 管理機能は後で実装します</p>
    </main>
  );
}
