export const dynamic = "force-dynamic";
import TicketsGrid from "@/components/TicketsGrid";

export default function MyTickets() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">繝槭う蝠上＞蜷医ｏ縺・/h1>
      <TicketsGrid scope="mine" />
    </div>
  );
}

