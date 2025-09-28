import TicketsGrid from "@/components/TicketsGrid";

export default function MyTickets() {
  return (
    <div className="space-y-4" style={{padding:16}}>
      <h1 className="text-xl font-semibold">自分のチケット</h1>
      <TicketsGrid scope="mine" />
    </div>
  );
}