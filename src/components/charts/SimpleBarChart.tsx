"use client";
import { BRAND } from "./brand";
type Row = { label: string; value: number };
export default function SimpleBarChart({ rows, height = 180 }: { rows: Row[]; height?: number }) {
  const data = rows?.length ? rows : [];
  if (!data.length) return <div style={{ color:"#64748b" }}>—</div>;
  const max = Math.max(...data.map(d => d.value || 0), 1);
  const w = Math.max(data.length * 48 + 16, 200);
  const h = height;
  const pad = 12;
  const barW = 28;
  const step = (w - pad * 2) / data.length;
  return (
    <div style={{ width:"100%", overflow:"hidden" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="bar">
        {data.map((d, i) => {
          const v = Math.max(0, d.value || 0);
          const bh = ((v / max) * (h - pad * 2)) || 0;
          const x = pad + i * step + (step - barW) / 2;
          const y = h - pad - bh;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} fill={BRAND.primary} rx="3"><title>{`${d.label}: ${v}`}</title></rect>
              <text x={x + barW / 2} y={h - 2} fontSize="10" fill="#475569" textAnchor="middle">{d.label}</text>
              <text x={x + barW / 2} y={y - 4} fontSize="10" fill="#0f172a" textAnchor="middle">{v}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}