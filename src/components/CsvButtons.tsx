"use client";
import { apiGet } from "@/lib/api";

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map(h => {
      const v = r[h] ?? "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(","));
  }
  return lines.join("\n");
}
function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function CsvButtons({ days = 14 }: { days?: number }) {
  async function exportDays() {
    const stats = await apiGet<any>(`/tickets/stats?days=${days}`, { fallback: { series: { labels: [], counts: [] } } });
    const rows = (stats.series?.labels ?? []).map((d: string, i: number) => ({ date: d, count: stats.series.counts[i] ?? 0 }));
    download(`tickets-days-${days}.csv`, toCsv(rows));
  }
  async function exportUsers() {
    const users = await apiGet<any[]>(`/tickets/stats/users?days=${days}`, { fallback: [] });
    download(`tickets-users-${days}.csv`, toCsv(users));
  }
  return (
    <div style={{ display:"flex", gap:8 }}>
      <button onClick={exportDays} className="btn">日別CSV</button>
      <button onClick={exportUsers} className="btn">担当者CSV</button>
      <style jsx>{`.btn{padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;background:#fff}.btn:hover{background:#f8fafc}`}</style>
    </div>
  );
}