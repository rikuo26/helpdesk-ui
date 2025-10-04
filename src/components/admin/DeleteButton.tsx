"use client";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string | number }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm(`チケット #${id} を削除します。よろしいですか？`)) return;
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(String(id))}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `${res.status} ${res.statusText}`);
      }
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