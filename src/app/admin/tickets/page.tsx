import TicketsGrid from "@/components/TicketsGrid";

export default async function AdminTicketsPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>チケット管理</h1>
      <TicketsGrid scope="all" />
    </main>
  );
}