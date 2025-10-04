import TicketDetailView from "@/components/TicketDetailView";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const id = String(params?.id ?? "");
  return <TicketDetailView id={id} />;
}