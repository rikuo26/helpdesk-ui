import TicketEditForm from "@/components/admin/TicketEditForm";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TicketEditForm id={String(id)} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <DeleteButton id={String(id)} />
      </div>
    </div>
  );
}