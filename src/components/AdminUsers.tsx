"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

type Row = {
  owner: string;
  total: number;
  open: number;
  investigating: number;
  waiting: number;
  in_progress: number;
  done: number;
};
type Resp = { granularity: "day"|"month"; range: number; rows: Row[] };

const BRAND = {
  primary: "#0078D4",
  primaryDark: "#005A9E",
  accent: "#1496FF",
  accent2: "#61A0FF",
  green: "#22C55E",
  orange: "#F59E0B",
  yellow: "#EAB308",
  gray: "#6B7280",
};

export default function AdminUsers() {
  const [mode, setMode] = useState<"day"|"month">("day");
  const [days, setDays] = useState(14);
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const q = mode === "day"
        ? `/api/tickets/stats/users?granularity=day&days=${days}`
        : `/api/tickets/stats/users?granularity=month&months=${months}`;
      const r = await fetch(q, { cache: "no-store" });
      setData(await r.json());
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [mode, days, months]);

  const chartData = useMemo(() => (data?.rows ?? []).map(r => ({
    owner: r.owner,
    受付: r.open,
    調査中: r.investigating,
    対応待ち: r.waiting,
    対応中: r.in_progress,
    完了: r.done,
    合計: r.total,
  })), [data]);

  function downloadCsv() {
    const q = mode === "day"
      ? `/api/tickets/stats/users?granularity=day&days=${days}&format=csv`
      : `/api/tickets/stats/users?granularity=month&months=${months}&format=csv`;
    const a = document.createElement("a");
    a.href = q;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (loading) return <div>読み込み中…</div>;
  if (!data || data.rows.length === 0) return <div className="text-gray-500">データがありません。</div>;

  return (
    <div className="space-y-4">
      {/* コントロール */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border overflow-hidden">
          <button className={`px-3 py-1.5 text-sm ${mode==="day" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={() => setMode("day")}>日次</button>
          <button className={`px-3 py-1.5 text-sm border-l ${mode==="month" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={() => setMode("month")}>月次</button>
        </div>

        {mode === "day" ? (
          <div className="inline-flex rounded-xl border overflow-hidden">
            {[7,14,30,90].map(v => (
              <button key={v} className={`px-3 py-1.5 text-sm ${days===v ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={() => setDays(v)}>{v}日</button>
            ))}
          </div>
        ) : (
          <div className="inline-flex rounded-xl border overflow-hidden">
            {[3,6,12].map(v => (
              <button key={v} className={`px-3 py-1.5 text-sm ${months===v ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={() => setMonths(v)}>{v}ヶ月</button>
            ))}
          </div>
        )}

        <button onClick={downloadCsv} className="ml-auto px-3 py-1.5 text-sm rounded-xl border hover:bg-[#E6F2FB]">
          CSVダウンロード
        </button>
      </div>

      {/* 横棒グラフ（ユーザー合計） */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="font-semibold mb-2">ユーザー別 件数（合計）</div>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={chartData.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="owner" width={160} />
              <Tooltip />
              <Legend />
              <Bar dataKey="合計" fill={BRAND.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 積み上げ横棒（ステータス内訳） */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="font-semibold mb-2">ユーザー別 ステータス内訳</div>
        <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={chartData.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="owner" width={160} />
              <Tooltip />
              <Legend />
              <Bar dataKey="受付" stackId="a" fill={BRAND.gray} />
              <Bar dataKey="調査中" stackId="a" fill={BRAND.orange} />
              <Bar dataKey="対応待ち" stackId="a" fill={BRAND.yellow} />
              <Bar dataKey="対応中" stackId="a" fill={BRAND.primary} />
              <Bar dataKey="完了" stackId="a" fill={BRAND.green} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 表形式（上位のみ表示） */}
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-[880px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">ユーザー</th>
              <th className="text-right px-4 py-2">合計</th>
              <th className="text-right px-4 py-2">受付</th>
              <th className="text-right px-4 py-2">調査中</th>
              <th className="text-right px-4 py-2">対応待ち</th>
              <th className="text-right px-4 py-2">対応中</th>
              <th className="text-right px-4 py-2">完了</th>
            </tr>
          </thead>
          <tbody>
            {(data.rows ?? []).slice(0, 50).map(r => (
              <tr key={r.owner} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{r.owner}</td>
                <td className="px-4 py-2 text-right">{r.total}</td>
                <td className="px-4 py-2 text-right">{r.open}</td>
                <td className="px-4 py-2 text-right">{r.investigating}</td>
                <td className="px-4 py-2 text-right">{r.waiting}</td>
                <td className="px-4 py-2 text-right">{r.in_progress}</td>
                <td className="px-4 py-2 text-right">{r.done}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


