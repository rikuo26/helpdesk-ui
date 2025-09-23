import TicketsGrid from "@/components/TicketsGrid";

export default function AdminTickets() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">チケット管理（管理者）</h1>
      <TicketsGrid scope="all" admin />
    </div>
  );
}
