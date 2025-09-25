"use client";
import { useSearchParams, useRouter } from "next/navigation";
import TicketsGrid from "@/components/TicketsGrid";
import TicketsTable from "@/components/TicketsTable";

export default function AdminTickets() {
  const sp = useSearchParams();
  const router = useRouter();
  const view = (sp.get("view") ?? "cards") as "cards"|"table";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">チケット管理（管理者）</h1>
        <div className="inline-flex rounded-xl border overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm ${view==="cards" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
            onClick={() => router.push("?view=cards")}
          >カード</button>
          <button
            className={`px-3 py-1.5 text-sm border-l ${view==="table" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
            onClick={() => router.push("?view=table")}
          >テーブル</button>
        </div>
      </div>

      {view === "cards" ? <TicketsGrid scope="all" admin /> : <TicketsTable />}
    </div>
  );
}
