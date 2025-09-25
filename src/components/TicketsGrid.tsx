"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast";
import StatusProgress, { type StatusKey } from "@/components/StatusProgress";
import StatusBadge from "@/components/StatusBadge";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  owner?: string;
  status?: StatusKey;
  createdAt?: string;
};

export default function TicketsGrid({ scope, admin }: { scope: "recent"|"mine"|"all"; admin?: boolean }) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusKey | "all">("all"); // マイページ用の簡易フィルタ

  async function refresh() {
    const res = await fetch(`/api/tickets?scope=${scope}`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    (async () => {
      try { await refresh(); }
      catch { toast.error("チケットの取得に失敗しました"); }
      finally { setLoading(false); }
    })();
  }, [scope]);

  async function updateStatus(id: string, status: StatusKey) {
    try {
      setItems(prev => prev.map(t => t.id === id ? { ...t, status } : t)); // 楽観更新
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success("ステータスを更新しました");
    } catch {
      toast.error("ステータス更新に失敗しました");
      try { await refresh(); } catch {}
    }
  }

  const shown = items.filter(t => filter==="all" ? true : (t.status === filter));

  if (loading) return <div>読み込み中…</div>;
  if (items.length === 0) return <div className="text-gray-500">チケットはありません。</div>;

  return (
    <>
      {/* フィルタ（マイページや一覧でも使える簡易版） */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["all","open","investigating","waiting","in_progress","done"].map((k) => (
          <button
            key={k}
            className={`text-xs rounded-full px-3 py-1 border transition ${
              (filter===k ? "bg-[#E6F2FB] border-[#0f5ea8] text-[#0f5ea8]" : "bg-white hover:bg-gray-50")
            }`}
            onClick={() => setFilter(k as any)}
          >
            {k==="all" ? "すべて" : k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {shown.map(t => (
          <article key={t.id} className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold line-clamp-1">{t.title}</h2>
              <StatusBadge value={t.status} />
            </div>

            <p className="mt-2 text-sm text-gray-600 line-clamp-3">{t.description}</p>

            {/* 進捗バー（管理者はクリック可能） */}
            <StatusProgress
              current={t.status}
              editable={!!admin}
              onChange={(next) => admin && updateStatus(t.id, next)}
            />

            {/* 管理者向けのドロップダウン（補助） */}
            {admin && (
              <div className="mt-3">
                <label className="text-xs mr-2 text-gray-600">状態変更:</label>
                <select
                  className="text-sm border rounded-lg px-2 py-1"
                  value={t.status ?? "open"}
                  onChange={(e) => updateStatus(t.id, e.target.value as StatusKey)}
                >
                  <option value="open">受付</option>
                  <option value="investigating">調査中</option>
                  <option value="waiting">対応待ち</option>
                  <option value="in_progress">対応中</option>
                  <option value="done">完了</option>
                </select>
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500">
              {(t.owner ?? "me")} / {new Date(t.createdAt ?? Date.now()).toLocaleString()}
            </div>
            <div className="mt-4">
              <a className="px-3 py-1.5 rounded-lg border hover:bg-[#E6F2FB]" href={`/tickets/${t.id}`}>詳細</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
