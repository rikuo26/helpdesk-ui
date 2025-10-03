"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast";
import type { StatusKey } from "@/components/StatusProgress";
import StatusBadge from "@/components/StatusBadge";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  owner?: string;
  status?: StatusKey;
  createdAt?: string;
};

export default function TicketsTable() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await fetch(`/api/tickets?scope=all`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    setItems(await res.json());
  }

  useEffect(() => {
    (async () => { try { await refresh(); } catch { toast.error("取得失敗"); } finally { setLoading(false); } })();
  }, []);

  if (loading) return <div>読み込み中…</div>;
  if (items.length === 0) return <div className="text-gray-500">チケットはありません。</div>;

  return (
    <div className="overflow-auto rounded-xl border bg-white">
      <table className="min-w-[720px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-4 py-2">タイトル</th>
            <th className="text-left px-4 py-2">所有者</th>
            <th className="text-left px-4 py-2">ステータス</th>
            <th className="text-left px-4 py-2">作成日時</th>
            <th className="text-left px-4 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map(t => (
            <tr key={t.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{t.title}</td>
              <td className="px-4 py-2">{t.owner ?? "me"}</td>
              <td className="px-4 py-2"><StatusBadge value={t.status} /></td>
              <td className="px-4 py-2">{new Date(t.createdAt ?? Date.now()).toLocaleString()}</td>
              <td className="px-4 py-2">
                <a className="px-3 py-1.5 rounded-lg border hover:bg-[#E6F2FB]" href={`/tickets/${t.id}`}>詳細</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


