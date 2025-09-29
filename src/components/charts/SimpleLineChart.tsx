"use client";
import React, { useMemo, useRef, useState } from "react";
import { BRAND } from "./brand";

type Props = { data: number[]; labels?: string[]; height?: number; };

export default function SimpleLineChart({ data, labels = [], height = 160 }: Props) {
  const xs = data?.length ? data : [0];
  const max = Math.max(...xs, 1);
  const w = Math.max((xs.length - 1) * 24 + 24, 200);
  const h = height;
  const pad = 12;
  const step = (w - pad * 2) / Math.max(xs.length - 1, 1);
  const points = useMemo(
    () => xs.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(" "),
    [xs, step, h, pad, max]
  );
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let i = Math.round((x - pad) / step);
    i = Math.max(0, Math.min(xs.length - 1, i));
    const cx = pad + i * step;
    const cy = h - pad - (xs[i] / max) * (h - pad * 2);
    setHover({ i, x: cx, y: cy });
  }
  function onLeave() { setHover(null); }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", overflow: "hidden" }}
         onMouseMove={onMove} onMouseLeave={onLeave}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="line">
        <polyline fill="none" stroke={BRAND.primary} strokeWidth="2" points={points}
                  style={{ transition: "all .2s ease" }} />
        {xs.map((v, i) => {
          const cx = pad + i * step;
          const cy = h - pad - (v / max) * (h - pad * 2);
          return <circle key={i} cx={cx} cy={cy} r="3"
                         fill={hover?.i === i ? BRAND.primaryLight : BRAND.primary}
                         style={{ transition: "all .15s ease" }} />;
        })}
      </svg>
      {hover && (
        <div style={{
          position: "absolute",
          left: `${(hover.x / w) * 100}%`,
          top: hover.y - 28,
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,.75)",
          color: "#fff",
          padding: "4px 6px",
          fontSize: 12,
          borderRadius: 4,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          {labels[hover.i] ? `${labels[hover.i]}: ` : ""}{xs[hover.i]}
        </div>
      )}
    </div>
  );
}