"use client";
import { useRouter } from "next/navigation";
import { deleteTicket } from "@/lib/api";

export default function DeleteButton({ id }: { id: string | number }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm(`チケット #${id} を削除します。よろしいですか？`)) return;
    try {
      // /api/tickets/:id に DELETE → ルート側で PATCH(status: "deleted") に変換される
      await deleteTicket(String(id));
      alert("削除しました。");
      router.push("/admin/tickets");
      router.refresh();
    } catch (e: any) {
      alert(`削除に失敗しました: ${e?.message ?? "unknown error"}`);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      style={{ background: "#dc2626", color: "#fff", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}
      title="このチケットを削除"
    >
      削除
    </button>
  );
}