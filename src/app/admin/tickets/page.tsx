import StatsBoard from "./StatsBoard";
import TicketsGrid from "@/components/TicketsGrid";

export default async function AdminTicketsPage() {
  return (
    <main style={{ padding: 16, display:"grid", gap:16 }}>
      <h1 style={{ fontSize:20, fontWeight:600 }}>チケット管理</h1>

      {/* ダッシュボード（期間切替・多KPI・チャート・CSV） */}
      <StatsBoard />

      {/* 一覧（既存） */}
      <section>
        <TicketsGrid scope="all" />
      </section>
    </main>
  );
}