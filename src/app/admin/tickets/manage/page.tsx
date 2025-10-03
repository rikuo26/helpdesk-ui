"use client";
import { useEffect, useMemo, useState } from "react";
import { apiGet, updateTicket } from "@/lib/api";

type TStatus = "open" | "in_progress" | "done";
type Ticket = {
  id:number; title:string; description?:string; status:TStatus|string;
  createdAt:string; createdBy?:string|null; assignedTo?:string|null; assignee?:string|null; owner?:string|null;
};
type Row = Ticket & { _saving?:boolean; _err?:string|null };

// ▼ 表示ラベルは日本語、値はそのまま
const COLS: {key:TStatus,label:string}[] = [
  { key:"open",         label:"未対応" },
  { key:"in_progress",  label:"対応中" },
  { key:"done",         label:"完了" },
];
const STEPS: TStatus[] = ["open","in_progress","done"];
const jpLabel = (st:TStatus)=> st==="open"?"未対応":st==="in_progress"?"対応中":"完了";

const css = {
  card:(saving:boolean)=>({
    background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:12, marginBottom:10,
    boxShadow: saving ? "0 0 0 2px #93c5fd inset, 0 1px 2px rgba(0,0,0,.05)" : "0 1px 2px rgba(0,0,0,.05)",
    opacity: saving ? .75 : 1, cursor:"grab", transition:"box-shadow .15s ease, opacity .15s ease"
  }),
  miniBtnPrimary:{
    background:"#2563eb", color:"#fff", border:"none", borderRadius:8, padding:"6px 10px", fontSize:12
  },
  miniBtnGhost:{
    background:"#f8fafc", color:"#374151", border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 8px", fontSize:12
  },
  tinyIconBtn:{
    width:28, height:28, borderRadius:8, display:"inline-flex", alignItems:"center", justifyContent:"center",
    background:"#f1f5f9", border:"1px solid #e5e7eb", cursor:"pointer"
  },
  pill:(active:boolean)=>({
    border:"1px solid #e5e7eb", borderRadius:999, padding:"4px 10px", fontSize:12,
    background: active ? "#2563eb" : "#f1f5f9", color: active ? "#fff" : "#111827"
  })
} as const;

function statusIndex(st:TStatus){ return Math.max(0, STEPS.indexOf(st)); }

function ProgressTrack({status}:{status:TStatus}) {
  const idx = statusIndex(status);
  return (
    <div style={{display:"flex", gap:6, marginTop:8}}>
      {STEPS.map((s,i)=>(
        <div
          key={i}
          title={jpLabel(s)}
          style={{
            flex:1, height:6, borderRadius:999,
            background: i<=idx ? "linear-gradient(90deg,#60a5fa,#2563eb)" : "#e5e7eb",
            transition:"all .2s ease"
          }}
        />
      ))}
    </div>
  );
}

function normalize(t:any): Row {
  return {
    ...t,
    status: (t.status ?? "open") as TStatus,
    assignedTo: t.assignedTo ?? t.assignee ?? t.owner ?? null,
    _saving: false, _err: null
  };
}

export default function KanbanManage(){
  const [rows, setRows]   = useState<Row[]>([]);
  const [q, setQ]         = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [colWidth, setColWidth] = useState<number>(340);
  const [memoDrafts, setMemoDrafts] = useState<Record<number,string>>({});

  useEffect(()=>{ (async()=>{
    const list = await apiGet<Ticket[]>("/tickets?scope=all", { fallback: [] as any });
    setRows((Array.isArray(list)?list:[]).map(normalize));
  })(); }, []);

  const people = useMemo(()=>{
    const s = new Set<string>();
    rows.forEach(r=>{ if (r.createdBy) s.add(String(r.createdBy)); if (r.assignedTo) s.add(String(r.assignedTo)); });
    return Array.from(s);
  }, [rows]);

  const me = (typeof window!=="undefined" && (window as any).__DEV_EMAIL__) || "";
  const filtered = useMemo(()=>{
    const kw = q.trim().toLowerCase();
    return rows.filter(r=>{
      if (onlyMine && me && r.assignedTo && String(r.assignedTo).toLowerCase()!==me.toLowerCase()) return false;
      if (!kw) return true;
      return (`${r.id} ${r.title??""} ${r.description??""} ${r.createdBy??""} ${r.assignedTo??""}`.toLowerCase().includes(kw));
    });
  }, [rows,q,onlyMine,me]);

  const byStatus = (st:TStatus)=> filtered.filter(r=>r.status===st);

  function onDragStart(e:React.DragEvent, id:number){
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  }
  async function onDrop(e:React.DragEvent, dest:TStatus){
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    await moveTo(id, dest);
  }
  async function moveBy(r:Row, delta:number){
    const cur = statusIndex(r.status as TStatus);
    const next = Math.min(STEPS.length-1, Math.max(0, cur+delta));
    const dest = STEPS[next];
    if (dest !== r.status) await moveTo(r.id, dest);
  }
  async function moveTo(id:number, dest:TStatus){
    setRows(prev => prev.map(r => r.id===id ? ({...r, status:dest, _saving:true, _err:null}) : r));
    try{
      await updateTicket(String(id), { status: dest });
      setRows(prev => prev.map(r => r.id===id ? ({...r, _saving:false}) : r));
    }catch(err:any){
      setRows(prev => prev.map(r => r.id===id ? ({...r, _saving:false, _err: err?.message ?? "更新に失敗"}) : r));
    }
  }

  async function saveAssignee(r:Row){
    setRows(prev => prev.map(x=>x.id===r.id?({...x,_saving:true,_err:null}):x));
    try{
      const body:any = { assignedTo: r.assignedTo ?? null, assignee: r.assignedTo ?? null, owner: r.assignedTo ?? null };
      await updateTicket(String(r.id), body);
      setRows(prev => prev.map(x=>x.id===r.id?({...x,_saving:false}):x));
    }catch(err:any){
      setRows(prev => prev.map(x=>x.id===r.id?({...x,_saving:false,_err:err?.message ?? "保存失敗"}):x));
    }
  }

  async function saveMemo(r:Row){
    const text = (memoDrafts[r.id] ?? "").trim();
    if (!text) return;
    setRows(prev => prev.map(x=>x.id===r.id?({...x,_saving:true,_err:null}):x));
    try{
      const payload:any = { worklog:text, note:text, comment:text, lastNote:text };
      try {
        await updateTicket(String(r.id), payload);
      } catch {
        const stamp = new Date().toLocaleString();
        const merged = `${r.description ?? ""}\n\n--- 対応メモ ${stamp} ---\n${text}`;
        await updateTicket(String(r.id), { description: merged });
        setRows(prev=>prev.map(x=>x.id===r.id?({...x, description:merged}):x));
      }
      setMemoDrafts(prev=>({ ...prev, [r.id]:""}));
      setRows(prev => prev.map(x=>x.id===r.id?({...x,_saving:false}):x));
    }catch(err:any){
      setRows(prev => prev.map(x=>x.id===r.id?({...x,_saving:false,_err:err?.message ?? "メモ保存に失敗"}):x));
    }
  }

  function Card({r}:{r:Row}){
    const memo = memoDrafts[r.id] ?? "";
    return (
      <div draggable onDragStart={(e)=>onDragStart(e,r.id)} style={css.card(!!r._saving)}>
        {/* ヘッダー行 */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
          <div style={{display:"flex", alignItems:"center", gap:8, minWidth:0}}>
            <div style={{fontWeight:700, whiteSpace:"nowrap"}}>#{r.id}</div>
            <div style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{r.title}</div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            {/* ここから直接ステータス更新（表示は日本語） */}
            <select
              value={r.status as TStatus}
              onChange={(e)=>moveTo(r.id, e.currentTarget.value as TStatus)}
              title="ステータス"
              style={{border:"1px solid #e5e7eb", borderRadius:8, padding:"4px 6px", fontSize:12, background:"#fff"}}
            >
              <option value="open">未対応</option>
              <option value="in_progress">対応中</option>
              <option value="done">完了</option>
            </select>
            <button title="左へ" onClick={()=>moveBy(r,-1)} style={css.tinyIconBtn} aria-label="move left">‹</button>
            <button title="右へ" onClick={()=>moveBy(r,+1)} style={css.tinyIconBtn} aria-label="move right">›</button>
          </div>
        </div>

        {/* 概要 */}
        {r.description && (
          <div style={{fontSize:12, color:"#6b7280", marginTop:6, maxHeight:54, overflow:"hidden", maskImage:"linear-gradient(#000, rgba(0,0,0,0.1))"}}>
            {r.description}
          </div>
        )}

        {/* 進捗トラック（ツールチップに日本語ラベル） */}
        <ProgressTrack status={r.status as TStatus} />

        {/* 担当（コンパクト） */}
        <div style={{display:"grid", gridTemplateColumns:"auto 1fr auto", gap:8, alignItems:"center", marginTop:10}}>
          <div style={{fontSize:12, color:"#6b7280"}}>担当</div>
          <input
            list="assignees"
            value={r.assignedTo ?? ""}
            onChange={(e)=>{ const v=e.currentTarget.value; setRows(prev=>prev.map(x=>x.id===r.id?({...x,assignedTo:v}):x)); }}
            placeholder="メール/名前"
            style={{border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 8px", fontSize:12}}
          />
          <button onClick={()=>saveAssignee(r)} disabled={!!r._saving} style={css.miniBtnPrimary}>
            {r._saving? "保存中" : "保存"}
          </button>
        </div>

        {/* 対応メモ */}
        <div style={{marginTop:8}}>
          <div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>対応メモ</div>
          <textarea
            rows={3}
            value={memo}
            onChange={(e)=> setMemoDrafts(prev=>({ ...prev, [r.id]: e.currentTarget.value })) }
            placeholder="今回の対応内容を簡潔に"
            style={{width:"100%", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px", fontSize:12}}
          />
          <div style={{display:"flex", gap:8, marginTop:6}}>
            <button onClick={()=>saveMemo(r)} disabled={!!r._saving || memo.trim()===""} style={css.miniBtnPrimary}>
              {r._saving? "保存中..." : "メモを保存"}
            </button>
            <button onClick={()=>setMemoDrafts(prev=>({ ...prev, [r.id]:""}))} style={css.miniBtnGhost}>
              クリア
            </button>
            <a href={`/admin/tickets/${r.id}`} style={{fontSize:12, color:"#2563eb", marginLeft:"auto"}}>詳細・編集</a>
          </div>
        </div>

        <div style={{fontSize:12, color:"#6b7280", marginTop:8}}>
          {new Date(r.createdAt).toLocaleString()}（{r.createdBy || "-"}）
        </div>
        {r._err && <div style={{color:"#b91c1c", marginTop:6, fontSize:12}}>{r._err}</div>}
      </div>
    );
  }

  function Column({st}:{st:TStatus}){
    const [over,setOver]=useState(false);
    const list = byStatus(st);
    return (
      <div
        onDragOver={(e)=>{e.preventDefault(); setOver(true);}}
        onDragLeave={()=>setOver(false)}
        onDrop={(e)=>{setOver(false); onDrop(e,st);}}
        style={{
          background: over ? "#eef2ff" : "#f8fafc",
          border: over ? "2px dashed #60a5fa" : "1px dashed #e5e7eb",
          borderRadius:14, padding:12, minHeight:360, transition:"all .12s ease"
        }}
      >
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
          <div style={{fontWeight:800}}>{COLS.find(c=>c.key===st)?.label}</div>
          <div style={{fontSize:12, color:"#6b7280"}}>{list.length}件</div>
        </div>
        {list.map(r=><Card key={r.id} r={r}/>)}
        {list.length===0 && <div style={{fontSize:12, color:"#6b7280"}}>ここにドラッグして移動</div>}
      </div>
    );
  }

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:8}}>
        <h1 style={{fontSize:18, fontWeight:800}}>チケット管理（カンバン）</h1>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <input placeholder="検索: ID/件名/説明/担当/作成" value={q} onChange={e=>setQ(e.target.value)}
                 style={{border:"1px solid #e5e7eb", borderRadius:8, padding:"8px", width:320}}/>
          <label style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#374151"}}>
            <input type="checkbox" checked={onlyMine} onChange={(e)=>setOnlyMine(e.currentTarget.checked)}/>
            自分の担当のみ
          </label>
          <div style={{display:"flex", gap:6, alignItems:"center"}}>
            <span style={{fontSize:12, color:"#6b7280"}}>列幅</span>
            <button style={css.pill(colWidth===280)} onClick={()=>setColWidth(280)}>コンパクト</button>
            <button style={css.pill(colWidth===340)} onClick={()=>setColWidth(340)}>標準</button>
            <button style={css.pill(colWidth===420)} onClick={()=>setColWidth(420)}>ワイド</button>
          </div>
          <a href="/admin/tickets" style={{fontSize:12, color:"#2563eb"}}>ダッシュボード</a>
        </div>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns: `repeat(3, minmax(${colWidth}px, 1fr))`,
        gap:12,
        overflowX:"auto",
        paddingBottom:8
      }}>
        {COLS.map(c => <div key={c.key}><Column st={c.key}/></div>)}
      </div>

      <datalist id="assignees">
        {people.map(p=><option key={p} value={p} />)}
      </datalist>
    </div>
  );
}