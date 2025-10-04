"use client";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string | number }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm(`チケット #${id} を削除します。よろしいですか？`)) return;
    try {
      const idStr = encodeURIComponent(String(id));

      // 1) まず REST の DELETE を試す
      let res = await fetch(`/api/tickets/${idStr}`, { method: "DELETE" });

      // 2) ダメならフォールバック（POST /api/tickets/delete?id=...）
      if (!res.ok) {
        res = await fetch(`/api/tickets/delete?id=${idStr}`, { method: "POST" });
      }

      if (!res.ok) {
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
      onClick={onDelete}
      style={{ background:"#dc2626", color:"#fff", padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer" }}
      title="このチケットを削除"
    >
      削除
    </button>
  );
}