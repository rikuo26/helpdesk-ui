import { Suspense } from "react";
import TicketsGrid from "@/components/TicketsGrid";
import TicketForm from "@/components/TicketForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">ダッシュボード</h1>
      <TicketForm />
      <Suspense fallback={<div>読み込み中…</div>}>
        <TicketsGrid scope="recent" />
      </Suspense>
    </div>
  );
}
