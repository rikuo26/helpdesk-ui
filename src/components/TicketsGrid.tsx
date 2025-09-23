"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  owner?: string;
  status?: "open" | "in_progress" | "done";
  createdAt?: string;
};

export default function TicketsGrid({ scope, admin }: { scope: "recent"|"mine"|"all"; admin?: boolean }) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tickets?scope=${scope}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setItems(data);
      } catch {
        toast.error("チケットの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [scope]);

  if (loading) return <div>読み込み中…</div>;
  if (items.length === 0) return <div className="text-gray-500">チケットはありません。</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(t => (
        <article key={t.id} className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <h2 className="font-semibold line-clamp-1">{t.title}</h2>
            <span className="text-xs rounded-full px-2 py-0.5 border">{t.status ?? "open"}</span>
          </div>
          <p className="mt-2 text-sm text-gray-600 line-clamp-3">{t.description}</p>
          <div className="mt-3 text-xs text-gray-500">
            {(t.owner ?? "me")} / {new Date(t.createdAt ?? Date.now()).toLocaleString()}
          </div>
          <div className="mt-4 flex gap-2">
            <a className="px-3 py-1.5 rounded-lg border hover:bg-gray-50" href={`/tickets/${t.id}`}>詳細</a>
            {admin && (
              <>
                <button className="px-3 py-1.5 rounded-lg border hover:bg-gray-50" onClick={() => toast.info("アサイン（後で実装）")}>アサイン</button>
                <button className="px-3 py-1.5 rounded-lg border hover:bg-gray-50" onClick={() => toast.success("進捗更新（後で実装）")}>進捗</button>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
