import TicketsGrid from "../../../components/TicketsGrid";

export default function MyTickets() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">自分のチケット</h1>
      <TicketsGrid scope="mine" />
    </div>
  );
}