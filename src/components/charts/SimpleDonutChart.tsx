"use client";
import { BRAND } from "./brand";
type Item = { label: string; value: number; color?: string };
export default function SimpleDonutChart({ items, size = 160, thickness = 16 }: { items: Item[]; size?: number; thickness?: number; }) {
  const total = items.reduce((a, b) => a + (b.value || 0), 0);
  if (!total) return <div style={{ color:"#64748b" }}>—</div>;
  const cx = size/2, cy = size/2, r = (size - thickness)/2;
  let offset = 0;
  const palette = [BRAND.primary, BRAND.primaryLight, BRAND.green, BRAND.orange, BRAND.yellow, BRAND.red];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="donut">
      {items.map((it, i) => {
        const val = Math.max(0, it.value || 0);
        const frac = val / total;
        const len = 2*Math.PI*r;
        const dash = `${len*frac} ${len*(1-frac)}`;
        const rot = (offset/total)*360 - 90; offset += val;
        const color = it.color || palette[i%palette.length];
        return (
          <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={thickness}
                    strokeDasharray={dash} strokeLinecap="butt">
              <title>{`${it.label}: ${val}`}</title>
            </circle>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r - thickness/2} fill="transparent" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#334155">{total}</text>
    </svg>
  );
}