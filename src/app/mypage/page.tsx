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
        // Functions 蛛ｴ縺檎┌隕悶＠縺ｦ繧ょ撫鬘後↑縺・け繧ｨ繝ｪ縲ょｿ・ｦ√↓蠢懊§縺ｦ螳溯｣・↓蜷医ｏ縺帙※螟峨∴縺ｦ縺上□縺輔＞縲・        const qs = new URLSearchParams({ scope: "mine" });
        const r = await fetch(`/api/tickets?${qs.toString()}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        // 霑泌唆蠖｢縺碁・蛻・or { items: [...] } 縺ｮ縺ｩ縺｡繧峨〒繧よ鏡縺医ｋ繧医≧縺ｫ縺励※縺翫￥
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

  if (loading) return <main className="p-6 text-sm text-gray-600">隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ窶ｦ</main>;
  if (error)   return <main className="p-6 text-sm text-red-700">繧ｨ繝ｩ繝ｼ: {error}</main>;

  const empty = items.length === 0;

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">繝槭う繝壹・繧ｸ</h1>

      {empty && <div className="text-sm text-gray-600">陦ｨ遉ｺ縺ｧ縺阪ｋ繝√こ繝・ヨ縺ｯ縺ゅｊ縺ｾ縺帙ｓ</div>}

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
                菴懈・: {t.createdAt ?? "-"} / 譖ｴ譁ｰ: {t.updatedAt ?? "-"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
