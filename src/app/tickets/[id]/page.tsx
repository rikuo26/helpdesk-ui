import TicketDetailView from "@/components/TicketDetailView";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetailView id={String(id)} />;
}