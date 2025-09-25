"use client";
import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

type Stats = {
  total: number;
  today: number;
  statusCounts: Record<string, number>;
  owners: { name: string; value: number }[];
  series: { date: string; count: number }[];
};

type UserRow = {
  owner: string;
  total: number;
  open: number;
  investigating: number;
  waiting: number;
  in_progress: number;
  done: number;
};
type UsersResp = { granularity: "day"|"month"; range: number; rows: UserRow[] };

const STATUS_LABEL: Record<string,string> = {
  open: "受付", investigating: "調査中", waiting: "対応待ち", in_progress: "対応中", done: "完了",
};

// 鮮やか Azure 系パレット
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
const PIE_COLORS = [BRAND.primary, BRAND.accent, BRAND.accent2, BRAND.primaryDark, "#00B7C3"];

export default function AdminDashboard() {
  // 共通の表示モードと期間（ダッシュボードとユーザー別を連動）
  const [mode, setMode] = useState<"day"|"month">("day");
  const [days, setDays] = useState<number>(14);
  const [months, setMonths] = useState<number>(6);

  // 全体統計
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ユーザー別
  const [users, setUsers] = useState<UsersResp | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // 取得
  async function loadAll() {
    setLoadingStats(true);
    setLoadingUsers(true);
    try {
      const qStats = mode === "day"
        ? `/api/tickets/stats?granularity=day&days=${days}`
        : `/api/tickets/stats?granularity=month&months=${months}`;
      const qUsers = mode === "day"
        ? `/api/tickets/stats/users?granularity=day&days=${days}`
        : `/api/tickets/stats/users?granularity=month&months=${months}`;
      const [r1, r2] = await Promise.all([
        fetch(qStats, { cache: "no-store" }),
        fetch(qUsers, { cache: "no-store" }),
      ]);
      setStats(await r1.json());
      setUsers(await r2.json());
    } finally {
      setLoadingStats(false);
      setLoadingUsers(false);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [mode, days, months]);

  const statusData = useMemo(() =>
    Object.entries(stats?.statusCounts ?? {}).map(([k, v]) => ({ status: STATUS_LABEL[k] ?? k, count: v })),
  [stats]);

  const userChartData = useMemo(() =>
    (users?.rows ?? []).map(r => ({
      owner: r.owner,
      合計: r.total,
      受付: r.open,
      調査中: r.investigating,
      対応待ち: r.waiting,
      対応中: r.in_progress,
      完了: r.done,
    })), [users]);

  function downloadUsersCsv() {
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

  // ローディング
  if (loadingStats || loadingUsers) return <div>読み込み中…</div>;
  if (!stats) return <div className="text-gray-500">データがありません。</div>;

  return (
    <div className="space-y-6">
      {/* 共通コントロール（日次／月次 と 期間） */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm ${mode==="day" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
            onClick={() => setMode("day")}
          >日次</button>
          <button
            className={`px-3 py-1.5 text-sm border-l ${mode==="month" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
            onClick={() => setMode("month")}
          >月次</button>
        </div>

        {mode === "day" ? (
          <div className="inline-flex rounded-xl border overflow-hidden">
            {[7,14,30,90].map(v => (
              <button
                key={v}
                className={`px-3 py-1.5 text-sm ${days===v ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
                onClick={() => setDays(v)}
              >{v}日</button>
            ))}
          </div>
        ) : (
          <div className="inline-flex rounded-xl border overflow-hidden">
            {[3,6,12].map(v => (
              <button
                key={v}
                className={`px-3 py-1.5 text-sm ${months===v ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`}
                onClick={() => setMonths(v)}
              >{v}ヶ月</button>
            ))}
          </div>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="総チケット数" value={stats.total} />
        <KpiCard label="本日作成" value={stats.today} />
        <KpiCard label={mode==="day" ? `${days}日合計` : `${months}ヶ月合計`}
                 value={stats.series.reduce((a,b)=>a+b.count,0)} />
      </div>

      {/* ステータス別（棒） */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="font-semibold mb-2">ステータス別件数</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={BRAND.primary} stroke={BRAND.primaryDark} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 時系列（エリア） */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="font-semibold mb-2">{mode==="day" ? "日次推移" : "月次推移"}</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={stats.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke={BRAND.primary} fill={BRAND.accent} fillOpacity={0.35} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ownerトップ5（円） */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="font-semibold mb-2">所有者トップ5</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={stats.owners} dataKey="value" nameKey="name" outerRadius={90} isAnimationActive>
                {stats.owners.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ▼▼ ユーザー別集計（同一ページ内） ▼▼ */}
      {users && users.rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">ユーザー別 集計</h2>
            <button onClick={downloadUsersCsv} className="px-3 py-1.5 text-sm rounded-xl border hover:bg-[#E6F2FB]">
              CSVダウンロード
            </button>
          </div>

          {/* ユーザー別：合計（横棒） */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="font-semibold mb-2">ユーザー別 件数（合計）</div>
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={userChartData.slice(0, 15)}>
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

          {/* ユーザー別：ステータス内訳（積み上げ横棒） */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="font-semibold mb-2">ユーザー別 ステータス内訳</div>
            <div style={{ width: "100%", height: 420 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={userChartData.slice(0, 15)}>
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

          {/* ユーザー別：表 */}
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
                {(users.rows ?? []).slice(0, 50).map(r => (
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
        </>
      )}
    </div>
  );
}
