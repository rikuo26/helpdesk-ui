"use client";
export const dynamic = "force-dynamic";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TicketsGrid from "@/components/TicketsGrid";
import TicketsTable from "@/components/TicketsTable";
import AdminDashboard from "@/components/AdminDashboard"; // ← これを使う

export default function AdminTicketsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const view = (sp?.get("view") ?? "cards") as "cards" | "table" | "dashboard";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tickets (Admin)</h1>

        <div className="inline-flex rounded-xl border overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm ${view === "cards" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
            onClick={() => router.push("?view=cards")}
          >
            Cards
          </button>
          <button
            className={`px-3 py-1.5 text-sm border-l ${view === "table" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
            onClick={() => router.push("?view=table")}
          >
            Table
          </button>
          <button
            className={`px-3 py-1.5 text-sm border-l ${view === "dashboard" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
            onClick={() => router.push("?view=dashboard")}
          >
            Dashboard
          </button>
        </div>
      </div>

      {view === "cards" && <TicketsGrid scope="all" admin />}
      {view === "table" && <TicketsTable />}
      {view === "dashboard" && <AdminDashboard />} {/* ← Coming soon を撤回 */}
    </div>
  );
}


