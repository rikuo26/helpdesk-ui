"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Ticket = {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function MyPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Functions 側が無視しても問題ないクエリ。必要に応じて実装に合わせて変えてください。
        const qs = new URLSearchParams({ scope: "mine" });
        const r = await fetch(`/api/tickets?${qs.toString()}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        // 返却形が配列 or { items: [...] } のどちらでも拾えるようにしておく
        const list: Ticket[] = Array.isArray(data) ? data : (data?.items ?? []);
        list.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
        setItems(list);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="p-6 text-sm text-gray-600">読み込み中…</main>;
  if (error)   return <main className="p-6 text-sm text-red-700">エラー: {error}</main>;

  const empty = items.length === 0;

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">マイページ</h1>

      {empty && <div className="text-sm text-gray-600">表示できるチケットはありません</div>}

      {!!items.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="text-sm font-medium truncate">{t.title ?? "(no title)"}</div>
              <div className="text-xs text-gray-600 mt-1">status: {t.status ?? "-"}</div>
              {t.description && (
                <p className="text-sm text-gray-700 line-clamp-3 mt-2">{t.description}</p>
              )}
              <div className="text-xs text-gray-500 mt-2">
                作成: {t.createdAt ?? "-"} / 更新: {t.updatedAt ?? "-"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}