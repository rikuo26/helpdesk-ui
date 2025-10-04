"use client";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type TStatus = "open" | "in_progress" | "done";
type Ticket = {
  id:number; title:string; description?:string; status?:TStatus|string;
  createdAt:any; createdBy?:string|null; assignedTo?:string|null;
};

const LABEL: Record<TStatus,string> = { open:"未対応", in_progress:"対応中", done:"完了" };
const COLOR: Record<TStatus,{bg:string; fg:string; bar:string}> = {
  open:        { bg:"#eef2ff", fg:"#1f2937", bar:"#93c5fd" },
  in_progress: { bg:"#fff7ed", fg:"#7c2d12", bar:"#f59e0b" },
  done:        { bg:"#ecfdf5", fg:"#065f46", bar:"#34d399" },
};

function normalize(t:any): Ticket & { status: TStatus }{
  const st = String(t?.status ?? "open").toLowerCase();
  const s: TStatus = (st === "done" ? "done" : st === "in_progress" || st === "wip" ? "in_progress" : "open");
  return {
    id: Number(t?.id ?? 0),
    title: String(t?.title ?? ""),
    description: String(t?.description ?? ""),
    status: s,
    createdAt: t?.createdAt,
    createdBy: t?.createdBy ?? null,
    assignedTo: t?.assignedTo ?? null,
  };
}

// Dateパース（壊れてても落ちない）
function parseDate(src:any): Date | null {
  if (!src) return null;
  if (src instanceof Date) return Number.isFinite(+src) ? src : null;
  if (typeof src === "number") { const d = new Date(src); return Number.isFinite(+d) ? d : null; }
  const s = String(src).trim();
  let d = new Date(s);
  if (Number.isFinite(+d)) return d;
  const m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (m) {
    const [_, y, mo, da, hh="0", mm="0", ss="0"] = m;
    d = new Date(Date.UTC(+y, +mo-1, +da, +hh, +mm, +ss));
    if (Number.isFinite(+d)) return d;
  }
  return null;
}

function fmt(d:Date){ return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }

// 14日分のラベル・系列を生成（自分のチケットだけで集計）
function buildDaily(rows: (ReturnType<typeof normalize>)[], days=14){
  const todayUTC = new Date(); todayUTC.setUTCHours(0,0,0,0);
  const labels:string[] = [];
  const counts:Record<string,number> = {};
  for (let i=days-1;i>=0;i--){
    const d = new Date(todayUTC); d.setUTCDate(todayUTC.getUTCDate()-i);
    const key = d.toISOString().slice(0,10);
    labels.push(key); counts[key] = 0;
  }
  for (const r of rows){
    const d = parseDate(r.createdAt); if (!d) continue;
    const key = d.toISOString().slice(0,10);
    if (key in counts) counts[key] += 1;
  }
  const series = labels.map(k => counts[k]);
  const todayCount = counts[labels[labels.length-1]] ?? 0;
  const avg = Number((series.reduce((a,b)=>a+b,0) / Math.max(days,1)).toFixed(2));
  return { labels, series, todayCount, avg };
}

function ProgressBar({status}:{status:TStatus}){
  const pct = status==="done" ? 100 : status==="in_progress" ? 50 : 10;
  return (
    <div style={{height:6, background:"#f1f5f9", borderRadius:999}}>
      <div style={{
        width:`${pct}%`, height:6, borderRadius:999,
        background: COLOR[status].bar, transition:"width .2s ease"
      }}/>
    </div>
  );
}

function Pill({status}:{status:TStatus}){
  return (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:999, fontSize:12, fontWeight:600,
      background: COLOR[status].bg, color: COLOR[status].fg
    }}>{LABEL[status]}</span>
  );
}

function MiniBars({series}:{series:number[]}){
  const max = Math.max(1, ...series);
  const W = 160, H = 40, pad = 4;
  const bw = (W - pad*2) / series.length;
  return (
    <svg width={W} height={H} role="img" aria-label="14日件数">
      <rect x={0} y={0} width={W} height={H} fill="#fff"/>
      {series.map((v,i)=>{
        const h = Math.max(1, Math.round((v/max)*(H-pad*2)));
        const x = pad + i*bw + 1;
        const y = H - pad - h;
        return <rect key={i} x={x} y={y} width={Math.max(1,bw-2)} height={h} rx={2} ry={2} fill="#2563eb" />;
      })}
    </svg>
  );
}

export default function MyTicketsView({ scope }: { scope: "mine" | "all" }){
  const [raw, setRaw] = useState<(ReturnType<typeof normalize>)[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all"|TStatus>("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(()=>{ let aborted=false; (async()=>{
    try{
      setLoading(true); setErr("");
      const list = await apiGet<Ticket[]>(`/tickets?scope=${scope}`, { fallback: [] as any });
      if (!aborted) setRaw((Array.isArray(list)?list:[]).map(normalize));
    }catch(e:any){ if (!aborted) setErr(e?.message ?? "読み込みに失敗しました"); }
    finally{ if (!aborted) setLoading(false); }
  })(); return ()=>{aborted=true}; }, [scope]);

  const counts = useMemo(()=>{
    const o = { open:0, in_progress:0, done:0 } as Record<TStatus,number>;
    raw.forEach(r=>{ o[r.status]++; });
    return o;
  }, [raw]);

  const daily = useMemo(()=>buildDaily(raw, 14), [raw]);

  const filtered = useMemo(()=>{
    const kw = q.trim().toLowerCase();
    return raw.filter(r=>{
      if (tab!=="all" && r.status!==tab) return false;
      if (!kw) return true;
      return (`${r.id} ${r.title} ${r.description} ${r.createdBy ?? ""} ${r.assignedTo ?? ""}`.toLowerCase().includes(kw));
    });
  }, [raw, tab, q]);

  if (loading) return <div style={{padding:16}}>読み込み中...</div>;
  if (err) return <div style={{padding:16, color:"#b91c1c"}}>{err}</div>;

  const total = raw.length;

  return (
    <div style={{display:"grid", gap:16}}>
      {/* サマリー */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12}}>
        <div style={card}>
          <div style={kpiLabel}>総件数（{scope==="mine"?"自分":"すべて"}）</div>
          <div style={kpiValue}>{total}</div>
        </div>
        <div style={card}>
          <div style={kpiLabel}>本日新規</div>
          <div style={kpiValue}>{daily.todayCount}</div>
        </div>
        <div style={card}>
          <div style={kpiLabel}>14日平均/日</div>
          <div style={kpiValue}>{daily.avg}</div>
        </div>
        <div style={card}>
          <div style={kpiLabel}>ステータス内訳</div>
          <div style={{display:"grid", gap:6}}>
            <div style={row}><span>未対応</span><span>{counts.open}</span></div>
            <div style={row}><span>対応中</span><span>{counts.in_progress}</span></div>
            <div style={row}><span>完了</span><span>{counts.done}</span></div>
          </div>
        </div>
      </div>

      {/* 14日ミニバー */}
      <div style={card}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{fontWeight:700}}>件数推移（14日）</div>
          <div style={{fontSize:12, color:"#6b7280"}}>今日: {daily.todayCount} / 平均: {daily.avg}</div>
        </div>
        <div style={{marginTop:8}}><MiniBars series={daily.series}/></div>
      </div>

      {/* フィルター */}
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <div style={segWrap}>
          {(["all","open","in_progress","done"] as const).map(key=>{
            const active = (tab===key);
            const label = key==="all"?"すべて":LABEL[key as TStatus];
            return (
              <button key={key} onClick={()=>setTab(key as any)}
                style={{
                  padding:"6px 10px", border:"1px solid #e5e7eb",
                  background: active? "#2563eb" : "#fff",
                  color: active? "#fff" : "#2563eb",
                  borderRadius:6, fontSize:12
                }}>{label}</button>
            );
          })}
        </div>
        <input placeholder="検索: ID/件名/説明/担当/作成"
          value={q} onChange={e=>setQ(e.target.value)}
          style={{flex:1, border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 10px"}}/>
        <div style={{fontSize:12, color:"#6b7280"}}>{filtered.length}件</div>
      </div>

      {/* カード一覧 */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12}}>
        {filtered.map(r=>(
          <div key={r.id} style={card}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
              <div style={{fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>#{r.id} {r.title}</div>
              <Pill status={r.status}/>
            </div>
            <div style={{fontSize:12, color:"#6b7280", minHeight:32}}>{r.description}</div>
            <div style={{marginTop:10}}><ProgressBar status={r.status}/></div>
            <div style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:6, fontSize:12, marginTop:10}}>
              <div style={{color:"#6b7280"}}>担当</div>
              <div>{r.assignedTo ?? "—"}</div>
              <div style={{color:"#6b7280"}}>作成</div>
              <div>{(()=>{ const d=parseDate(r.createdAt); return d? fmt(d):"—"; })()}（{r.createdBy ?? "—"}）</div>
            </div>
            <div style={{marginTop:10}}>
              <a href={`/tickets/${r.id}`} style={{fontSize:12, color:"#2563eb"}}>詳細を見る</a>
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div style={{gridColumn:"1 / -1", padding:24, textAlign:"center", color:"#6b7280", border:"1px dashed #e5e7eb", borderRadius:12}}>
            該当するチケットはありません
          </div>
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:12, boxShadow:"0 1px 2px rgba(0,0,0,.04)"
};
const kpiLabel: React.CSSProperties = { fontSize:12, color:"#6b7280" };
const kpiValue: React.CSSProperties = { fontSize:28, fontWeight:800, lineHeight:1.2, marginTop:4 };
const row: React.CSSProperties = { display:"flex", justifyContent:"space-between" };
const segWrap: React.CSSProperties = { display:"flex", gap:6 };