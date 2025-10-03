"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { StatusPill } from "@/components/admin/StatusPill";

type Ticket = { id:number; title:string; description:string; status:string; createdAt:string; createdBy?:string };

export default function AdminTicketsListPage() {
  const [rows, setRows] = useState<Ticket[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState<""|"open"|"in_progress"|"done">("");
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    let aborted = false;
    (async()=>{
      setLoading(true);
      const list = await apiGet<Ticket[]>("/tickets?scope=all", { fallback: [] as any });
      if (!aborted) setRows(Array.isArray(list) ? list : []);
      setLoading(false);
    })();
    return ()=>{ aborted = true; };
  }, []);

  const filtered = useMemo(()=> {
    const kw = q.trim().toLowerCase();
    return rows
      .filter(r => !st || r.status === st)
      .filter(r => !kw || (r.title?.toLowerCase().includes(kw) || r.description?.toLowerCase().includes(kw) || String(r.id)===kw))
      .sort((a,b)=> b.id - a.id);
  }, [rows, q, st]);

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
        <h1 style={{fontSize:18, fontWeight:600}}>チケット管理</h1>
        <Link href="/admin/tickets/manage" style={{color:"#2563eb"}}>ダッシュボードへ</Link>
      </div>

      <div style={{display:"flex", gap:8, marginBottom:12}}>
        <input placeholder="ID / 件名 / 説明で検索" value={q} onChange={e=>setQ(e.target.value)}
               style={{flex:1, border:"1px solid #e5e7eb", borderRadius:6, padding:"8px"}}/>
        <select value={st} onChange={e=>setSt(e.target.value as any)}
                style={{border:"1px solid #e5e7eb", borderRadius:6, padding:"8px"}}>
          <option value="">すべて</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="done">done</option>
        </select>
      </div>

      <div style={{border:"1px solid #e5e7eb", borderRadius:8, background:"#fff"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead style={{background:"#f9fafb"}}>
            <tr>
              <th style={{textAlign:"left", padding:10, borderBottom:"1px solid #e5e7eb"}}>ID</th>
              <th style={{textAlign:"left", padding:10, borderBottom:"1px solid #e5e7eb"}}>件名</th>
              <th style={{textAlign:"left", padding:10, borderBottom:"1px solid #e5e7eb"}}>状態</th>
              <th style={{textAlign:"left", padding:10, borderBottom:"1px solid #e5e7eb"}}>作成日時</th>
              <th style={{textAlign:"left", padding:10, borderBottom:"1px solid #e5e7eb"}}>作成者</th>
              <th style={{textAlign:"left", padding:10, borderBottom:"1px solid #e5e7eb"}}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{padding:16}}>読み込み中...</td></tr>
            )}
            {!loading && filtered.length===0 && (
              <tr><td colSpan={6} style={{padding:16, color:"#6b7280"}}>データがありません</td></tr>
            )}
            {filtered.map(r=>(
              <tr key={r.id} style={{borderTop:"1px solid #f3f4f6"}}>
                <td style={{padding:10}}>{r.id}</td>
                <td style={{padding:10}}>{r.title}</td>
                <td style={{padding:10}}><StatusPill status={r.status}/></td>
                <td style={{padding:10}}>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={{padding:10}}>{r.createdBy || "-"}</td>
                <td style={{padding:10}}>
                  <Link href={`/admin/tickets/${r.id}`} style={{color:"#2563eb"}}>編集</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}