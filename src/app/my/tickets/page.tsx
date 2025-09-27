export const dynamic = "force-dynamic";
import TicketsGrid from "@/components/TicketsGrid";

export default function MyTickets() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">マイ問い合わせ</h1>
      <TicketsGrid scope="mine" />
    </div>
  );
}
