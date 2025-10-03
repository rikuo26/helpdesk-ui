"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const fmt = new Intl.NumberFormat("ja-JP");
const clamp = (n:number, min:number, max:number)=> Math.min(max, Math.max(min,n));
const useReduced = ()=> typeof window !== "undefined" &&
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Tooltip({x,y,label,value}:{x:number;y:number;label:string;value:string|number}) {
  const style: React.CSSProperties = {
    position:"absolute", left:x, top:y, transform:"translate(-50%,-110%)",
    background:"#fff", border:"1px solid #e5e7eb", borderRadius:6,
    boxShadow:"0 6px 20px rgba(0,0,0,.12)", padding:"6px 8px", fontSize:12, whiteSpace:"nowrap", pointerEvents:"none", zIndex:10
  };
  return <div style={style}><div style={{color:"#6b7280"}}>{label}</div><div style={{fontWeight:600}}>{value}</div></div>;
}

/** 横棒棒グラフ（ホバー拡大＋ツールチップ＋キーボード操作） */
export function BarChart({labels, data, height=160}:{labels:string[]; data:number[]; height?:number}) {
  const max = Math.max(1, ...data);
  const [hi, setHi] = useState<number|null>(null);
  const [pos, setPos] = useState<{x:number;y:number}|null>(null);
  const reduced = useReduced();
  const ref = useRef<HTMLDivElement>(null);

  const bars = data.map((v,i)=>({
    value: v, label: labels[i] ?? "", h: max ? Math.round(v/max*100) : 0
  }));

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; const w = rect.width; const step = w / bars.length;
    const idx = clamp(Math.round(x/step-0.5), 0, bars.length-1);
    setHi(idx); setPos({x: e.clientX - rect.left, y: e.clientY - rect.top});
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={()=>{ setHi(null); setPos(null); }}
      style={{position:"relative", height, display:"flex", gap:10, alignItems:"end"}}>
      {bars.map((b,i)=>{
        const active = hi===i;
        return (
          <button key={i}
            onFocus={()=>setHi(i)} onBlur={()=>setHi(null)}
            onKeyDown={(e)=>{ if(e.key==="ArrowRight") setHi(clamp((hi??i)+1,0,bars.length-1));
                               if(e.key==="ArrowLeft")  setHi(clamp((hi??i)-1,0,bars.length-1)); }}
            aria-label={`${b.label}: ${b.value}`}
            style={{
              appearance:"none", background:"transparent", border:"none", padding:0, margin:0,
              outline:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6
            }}>
            <div style={{
              width:22, height:120, background:"#eff2ff", borderRadius:4,
              display:"flex", alignItems:"end", justifyContent:"center"
            }}>
              <div style={{
                width:22, height:`${b.h}%`,
                background: active? "#1d4ed8" : "#2563eb",
                borderRadius:4, transform: active? "scale(1.06)" : "scale(1)",
                boxShadow: active? "0 6px 18px rgba(37,99,235,.35)" : "none",
                transition: reduced ? "none" : "height 600ms cubic-bezier(.2,.8,.2,1), transform 200ms, box-shadow 200ms"
              }}/>
            </div>
            <div style={{fontSize:10, color:"#6b7280", maxWidth:60, textAlign:"center", lineHeight:1.2}}>
              {b.label}
            </div>
          </button>
        );
      })}
      {hi!=null && pos && (
        <Tooltip x={pos.x} y={pos.y} label={labels[hi]} value={fmt.format(data[hi])}/>
      )}
    </div>
  );
}

/** スパークライン（描画アニメ＋クロスヘア＋ツールチップ＋面グラデ） */
export function SparklineChart({labels, data, height=120}:{labels:string[]; data:number[]; height?:number}) {
  const reduced = useReduced();
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(300);
  const [hi, setHi] = useState<number|null>(null);
  const [pos, setPos] = useState<{x:number;y:number}|null>(null);
  const max = Math.max(1, ...data);
  const pad = 8;

  // ResizeObserver で横幅追従
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const ro = new ResizeObserver(()=> setW(el.clientWidth || 300));
    ro.observe(el); setW(el.clientWidth || 300);
    return ()=>ro.disconnect();
  },[]);

  const points = useMemo(()=>{
    const step = data.length>1? (w - pad*2)/(data.length-1) : 0;
    const y = (v:number)=> (height-pad) - (v/max)*(height-pad*2);
    return data.map((v,i)=>`${pad + i*step},${y(v)}`).join(" ");
  },[data,w,max]);

  // draw アニメ用
  const pathRef = useRef<SVGPolylineElement>(null);
  useEffect(()=>{
    if (reduced) return;
    const p = pathRef.current; if (!p) return;
    const len = (p as any).getTotalLength?.() ?? 0;
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
    requestAnimationFrame(()=>{ p.style.transition = "stroke-dashoffset 900ms ease"; p.style.strokeDashoffset = "0"; });
    return ()=>{ p.style.transition = ""; p.style.strokeDasharray = ""; p.style.strokeDashoffset=""; };
  },[points,reduced]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>)=>{
    const el = ref.current; if(!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - pad;
    const step = data.length>1? (w - pad*2)/(data.length-1) : w;
    const idx = clamp(Math.round(x/step), 0, data.length-1);
    setHi(idx);
    setPos({x: e.clientX - rect.left, y: e.clientY - rect.top});
  };

  const step = data.length>1? (w - pad*2)/(data.length-1) : 0;
  const xHi = hi!=null ? pad + hi*step : null;
  const yHi = hi!=null ? (height-pad) - (data[hi]/max)*(height-pad*2) : null;

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={()=>{ setHi(null); setPos(null); }}
      style={{position:"relative", width:"100%", height}}>
      <svg width={w} height={height} style={{display:"block", background:"#fff"}}>
        {/* area グラデーション */}
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"  stopColor="#2563eb" stopOpacity="0.30"/>
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02"/>
          </linearGradient>
          <clipPath id="clip">
            <rect x="0" y="0" width={w} height={height}/>
          </clipPath>
        </defs>
        {/* 塗り */}
        <polyline
          points={`${points} ${w-pad},${height-pad} ${pad},${height-pad}`}
          fill="url(#g)" stroke="none" clipPath="url(#clip)"/>
        {/* 折れ線 */}
        <polyline ref={pathRef} points={points} fill="none" stroke="#2563eb" strokeWidth="2"/>
        {/* クロスヘア＋ホバードット */}
        {xHi!=null && yHi!=null && (
          <>
            <line x1={xHi} y1={pad} x2={xHi} y2={height-pad} stroke="#94a3b8" strokeDasharray="3 3"/>
            <circle cx={xHi} cy={yHi} r={4.5} fill="#fff" stroke="#2563eb" strokeWidth="2"/>
          </>
        )}
      </svg>
      {hi!=null && pos && (
        <Tooltip x={pos.x} y={pos.y} label={labels[hi] ?? ""} value={fmt.format(data[hi])}/>
      )}
    </div>
  );
}