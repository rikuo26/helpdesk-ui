"use client";
import React, { useMemo, useState } from "react";
import { BRAND } from "./brand";

type Item = { label: string; value: number; color?: string };
type Props = { items: Item[]; size?: number; thickness?: number };

export default function SimpleDonutChart({ items, size = 160, thickness = 16 }: Props) {
  const total = items.reduce((a, b) => a + (b.value || 0), 0);
  const cx = size / 2, cy = size / 2, r = (size - thickness) / 2;
  const palette = [BRAND.primary, BRAND.primaryLight, BRAND.green, BRAND.orange, BRAND.yellow, BRAND.red];
  const [hover, setHover] = useState<number | null>(null);

  const arcs = useMemo(() => {
    let offset = 0;
    return items.map((it, i) => {
      const val = Math.max(0, it.value || 0);
      const frac = total ? val / total : 0;
      const len = 2 * Math.PI * r;
      const dash = `${len * frac} ${len * (1 - frac)}`;
      const rot = (offset / Math.max(total, 1)) * 360 - 90;
      offset += val;
      return { dash, rot, color: it.color || palette[i % palette.length], value: val, label: it.label };
    });
  }, [items, total, r]);

  if (!total) return <div style={{ color: "#64748b" }}>—</div>;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="donut">
        {arcs.map((a, i) => (
          <g key={i} transform={`rotate(${a.rot} ${cx} ${cy})`}
             onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={thickness}
                    strokeDasharray={a.dash} strokeLinecap="butt"
                    style={{ opacity: hover === null || hover === i ? 1 : 0.35, transition: "all .15s ease" }} />
          </g>
        ))}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", pointerEvents:"none" }}>
        <div style={{ textAlign: "center", lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>{hover != null ? items[hover].label : "合計"}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {hover != null ? items[hover].value : total}
          </div>
          {hover != null && total > 0 && (
            <div style={{ fontSize: 12, color: "#334155" }}>
              {Math.round((items[hover].value / total) * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}