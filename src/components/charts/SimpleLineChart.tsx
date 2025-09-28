"use client";
import { BRAND } from "./brand";

type Props = {
  data: number[];
  labels?: string[];
  height?: number;
};

export default function SimpleLineChart({ data, labels = [], height = 140 }: Props) {
  const xs = data && data.length ? data : [0];
  const max = Math.max(...xs, 1);
  const w = Math.max((xs.length - 1) * 20 + 16, 180);
  const h = height;
  const pad = 8;
  const step = (w - pad * 2) / Math.max(xs.length - 1, 1);
  const points = xs.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(" ");

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="line">
        <polyline fill="none" stroke={BRAND.primary} strokeWidth="2" points={points} />
        {xs.map((v, i) => {
          const cx = pad + i * step;
          const cy = h - pad - (v / max) * (h - pad * 2);
          return <circle key={i} cx={cx} cy={cy} r="2.5" fill={BRAND.primary} />;
        })}
      </svg>
    </div>
  );
}