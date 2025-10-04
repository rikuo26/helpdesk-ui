import TicketEditForm from "@/components/admin/TicketEditForm";
import DeleteButton from "@/components/admin/DeleteButton";

export default function AdminTicketPage({ params }: { params: { id: string } }) {
  const id = String(params?.id ?? "");
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TicketEditForm id={id} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <DeleteButton id={id} />
      </div>
    </div>
  );
}