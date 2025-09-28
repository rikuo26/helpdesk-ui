"use client";
import React, { useRef, useState } from "react";
import { BRAND } from "./brand";

type Row = { label: string; value: number };
type Props = { rows: Row[]; height?: number };

export default function SimpleBarChart({ rows, height = 200 }: Props) {
  const data = rows?.length ? rows : [];
  if (!data.length) return <div style={{ color:"#64748b" }}>—</div>;

  const max = Math.max(...data.map(d => d.value || 0), 1);
  const w = Math.max(data.length * 56 + 24, 240);
  const h = height;
  const pad = 16;
  const barW = 30;
  const step = (w - pad * 2) / data.length;
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  return (
    <div style={{ width:"100%", overflow:"hidden", position:"relative" }}>
      <svg ref={ref} viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="bar">
        {data.map((d, i) => {
          const v = Math.max(0, d.value || 0);
          const bh = ((v / max) * (h - pad * 2)) || 0;
          const x = pad + i * step + (step - barW) / 2;
          const y = h - pad - bh;
          const active = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={y} width={barW} height={bh}
                    fill={active ? BRAND.primaryLight : BRAND.primary} rx="4"
                    style={{ transition: "all .15s ease" }} />
              <text x={x + barW / 2} y={h - 2} fontSize="10" fill="#475569" textAnchor="middle">{d.label}</text>
              <text x={x + barW / 2} y={y - 4} fontSize="11" fill="#0f172a" textAnchor="middle">{v}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}