"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import SimpleLineChart from "@/components/charts/SimpleLineChart";
import SimpleDonutChart from "@/components/charts/SimpleDonutChart";
import SimpleBarChart from "@/components/charts/SimpleBarChart";

type Stats = {
  total: number;                          // 全体総件数（現在の状態）
  newToday: number;                       // 今日新規
  byStatus: Record<string, number>;       // {open, in_progress, done}（現在の状態）
  series?: { labels: string[]; counts: number[] }; // 期間内の「日別 新規件数」
};

type UsersRow = {
  owner?: string;
  name?: string;
  total?: number;
  open?: number;
  in_progress?: number;
  done?: number;
};

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map(r => r.map(c => {
      const s = String(c ?? "");
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function StatsBoard() {
  const [days, setDays] = useState<7 | 14 | 30 | 90>(14);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UsersRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function load(d: 7 | 14 | 30 | 90) {
    setBusy(true);
    try {
      const [s, u] = await Promise.all([
        apiGet<Stats>(`/tickets/stats?days=${d}`, { fallback: { total:0, newToday:0, byStatus:{}, series:{ labels:[], counts:[] } } }),
        apiGet<UsersRow[]>(`/tickets/stats/users?days=${d}`, { fallback: [] })
      ]);
      setStats(s); setUsers(u);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(days); }, [days]);

  // ==== KPI 計算（UI 側で導出：バックエンドはそのまま） ====
  const periodTotal = useMemo(() => (stats?.series?.counts?.reduce((a,b)=>a+b,0) ?? 0), [stats]);
  const avgPerDay   = useMemo(() => (days ? Math.round(periodTotal / days) : 0), [periodTotal, days]);

  const open = stats?.byStatus?.open ?? 0;
  const prog = stats?.byStatus?.in_progress ?? 0;
  const done = stats?.byStatus?.done ?? 0;
  const nowTotal = open + prog + done || 1;

  const closedRate   = Math.round((done / nowTotal) * 100);                       // 現時点の完了率
  const active       = open + prog;
  const activeRate   = Math.round((active / nowTotal) * 100);                     // 未解決率
  const wipRate      = Math.round((prog / Math.max(active,1)) * 100);             // WIP 比率（未解決のうち進行中）

  const { peakLabel, peakValue } = useMemo(() => {
    const xs = stats?.series?.counts ?? [];
    if (!xs.length) return { peakLabel: "", peakValue: 0 };
    let idx = 0; for (let i=1;i<xs.length;i++) if (xs[i] > xs[idx]) idx = i;
    return { peakLabel: stats?.series?.labels?.[idx] ?? "", peakValue: xs[idx] ?? 0 };
  }, [stats]);

  // 曜日分布（期間内の新規件数を曜日集計）
  const weekdayRows = useMemo(() => {
    const labels = stats?.series?.labels ?? [];
    const counts = stats?.series?.counts ?? [];
    const bins = [0,0,0,0,0,0,0]; // Sun..Sat
    for (let i=0;i<labels.length;i++) {
      const d = new Date(labels[i]);
      if (!isNaN(d.getTime())) bins[d.getDay()] += counts[i] || 0;
    }
    const jp = ["日","月","火","水","木","金","土"];
    return jp.map((lab, i) => ({ label: lab, value: bins[i] }));
  }, [stats]);

  // トップ担当（総数ベース）
  const topOwnersRows = useMemo(() => {
    return [...users]
      .map(u => ({ label: (u.name || u.owner || "—").slice(0,6), value: u.total ?? 0 }))
      .sort((a,b)=>b.value-a.value)
      .slice(0,5);
  }, [users]);

  // 保有平均（未解決 = open+in_progress の合計を担当人数で割る）
  const ownerActiveAvg = useMemo(() => {
    if (!users.length) return 0;
    const ownSum = users.reduce((a,u)=>a + ((u.open ?? 0) + (u.in_progress ?? 0)), 0);
    const cnt    = users.length;
    return Math.round((ownSum / Math.max(cnt,1)) * 10) / 10;
  }, [users]);

  function exportUsersCsv() {
    const rows: (string|number)[][] = [["owner/name","total","open","in_progress","done"]];
    for (const r of users) rows.push([r.name || r.owner || "", r.total ?? 0, r.open ?? 0, r.in_progress ?? 0, r.done ?? 0]);
    downloadCsv(`users_stats_${days}d.csv`, rows);
  }
  function exportSeriesCsv() {
    const rows: (string|number)[][] = [["date","count"]];
    const labels = stats?.series?.labels ?? [];
    const counts = stats?.series?.counts ?? [];
    for (let i=0;i<labels.length;i++) rows.push([labels[i], counts[i] ?? 0]);
    downloadCsv(`series_${days}d.csv`, rows);
  }

  return (
    <div style={{ display:"grid", gap:12 }}>
      {/* ツールバー：期間切替 & CSV */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ fontWeight:600 }}>期間</div>
        {[7,14,30,90].map(d => (
          <button key={d}
            onClick={()=>setDays(d as any)} disabled={busy}
            title={`${d}日間で集計`}
            style={{
              padding:"4px 10px", border:"1px solid #cbd5e1", borderRadius:20, cursor:"pointer",
              background: d===days ? "#2563eb" : "white", color: d===days ? "#fff" : "#0f172a"
            }}>
            {d}日
          </button>
        ))}
        <div style={{ flex:1 }} />
        <button onClick={exportSeriesCsv} title="日別推移を CSV で保存"
          style={{ padding:"4px 10px", border:"1px solid #cbd5e1", borderRadius:6, background:"#fff" }}>
          日別CSV
        </button>
        <button onClick={exportUsersCsv} title="担当者別集計を CSV で保存"
          style={{ padding:"4px 10px", border:"1px solid #cbd5e1", borderRadius:6, background:"#fff" }}>
          担当者CSV
        </button>
      </div>

      {/* KPI 6枚 */}
      <section style={{ display:"grid", gridTemplateColumns:"repeat(6, minmax(0,1fr))", gap:12 }}>
        <Kpi title="総件数（現在）" value={stats?.total ?? 0} hint="システム全体の現在の件数" />
        <Kpi title={`${days}日合計`} value={periodTotal} hint="期間内の新規作成合計（series の合計）" />
        <Kpi title="平均/日" value={avgPerDay} hint={`${days}日間の1日平均（四捨五入）`} />
        <Kpi title="完了率" value={`${closedRate}%`} hint="現在の状態に対する完了割合" />
        <Kpi title="未解決率" value={`${activeRate}%`} hint="open + in_progress の割合" />
        <Kpi title="WIP比率" value={`${wipRate}%`} hint="未解決のうち in_progress の割合" />
      </section>

      {/* 2列：ドーナツ / 折れ線 */}
      <section style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:16 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>ステータス内訳（現在）</div>
          <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", alignItems:"center" }}>
            <SimpleDonutChart items={[
              { label:"open", value: open },
              { label:"in_progress", value: prog },
              { label:"done", value: done },
            ]} />
            <div style={{ display:"grid", gap:4 }}>
              <Row label="open" value={open} />
              <Row label="in_progress" value={prog} />
              <Row label="done" value={done} />
              <Row label="担当あたり保有(平均)" value={ownerActiveAvg} />
            </div>
          </div>
        </div>

        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>件数推移（{days}日）</div>
            {peakLabel && <div style={{ color:"#0f172a", fontSize:12 }}>ピーク {peakValue}（{peakLabel}）</div>}
          </div>
          <SimpleLineChart data={stats?.series?.counts ?? []} labels={stats?.series?.labels ?? []} height={160} />
        </div>
      </section>

      {/* 下段 2列：曜日分布 / トップ担当 */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>曜日分布（期間内の新規）</div>
          <SimpleBarChart rows={weekdayRows} height={200} />
        </div>
        <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
          <div style={{ color:"#64748b", fontSize:12, marginBottom:6 }}>トップ担当（総数）</div>
          <SimpleBarChart rows={topOwnersRows} height={200} />
        </div>
      </section>
    </div>
  );
}

function Kpi({ title, value, hint }:{ title:string; value: number|string; hint?:string }) {
  return (
    <div title={hint} style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
      <div style={{ color:"#64748b", fontSize:12 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700 }}>{value}</div>
    </div>
  );
}
function Row({ label, value }:{ label:string; value:number }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between" }}>
      <span style={{ color:"#475569" }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}