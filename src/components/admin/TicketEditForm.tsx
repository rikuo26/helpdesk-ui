"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTicket, updateTicket, deleteTicket } from "@/lib/api";
import { StatusPill } from "./StatusPill";

type Ticket = { id:number; title:string; description:string; status:"open"|"in_progress"|"done"; createdAt:string; createdBy?:string };

export default function TicketEditForm({ id }: { id:string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string>("");
  const [t, setT] = useState<Ticket|null>(null);

  useEffect(()=> {
    let aborted = false;
    (async()=>{
      setLoading(true);
      try {
        const data = await getTicket(id);
        if (!aborted) setT(data as Ticket);
      } catch (e:any) {
        if (!aborted) setError(e?.message ?? "読み込みエラー");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return ()=>{ aborted = true; };
  }, [id]);

  async function onSave() {
    if (!t) return;
    if (!t.title?.trim()) { setError("件名は必須です"); return; }
    setSaving(true); setError("");
    try {
      await updateTicket(String(t.id), { title: t.title, description: t.description, status: t.status });
      router.refresh();
    } catch (e:any) {
      setError(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!t) return;
    if (!confirm(`チケット #${t.id} を削除します。よろしいですか？`)) return;
    setSaving(true); setError("");
    try {
      await deleteTicket(String(t.id));
      router.push("/admin/tickets/list");
    } catch (e:any) {
      setError(e?.message ?? "削除に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{padding:16}}>読み込み中...</div>;
  if (!t)       return <div style={{padding:16, color:"#b91c1c"}}>チケットが見つかりません。</div>;

  return (
    <div style={{padding:16, display:"grid", gridTemplateColumns:"2fr 1fr", gap:16}}>
      <div style={{border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", padding:16}}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
          <a href="/admin/tickets/list" style={{fontSize:12,color:"#2563eb"}}>← 一覧へ戻る</a>
          <div style={{fontSize:12, color:"#6b7280"}}># {t.id}</div>
          <StatusPill status={t.status}/>
        </div>

        <label style={{display:"block", fontSize:12, color:"#6b7280"}}>件名</label>
        <input value={t.title} onChange={e=>setT({...t, title:e.target.value})}
               style={{width:"100%", border:"1px solid #e5e7eb", borderRadius:6, padding:"8px", marginTop:4, marginBottom:12}} />

        <label style={{display:"block", fontSize:12, color:"#6b7280"}}>説明</label>
        <textarea value={t.description ?? ""} onChange={e=>setT({...t, description:e.target.value})}
                  rows={10}
                  style={{width:"100%", border:"1px solid #e5e7eb", borderRadius:6, padding:"8px", marginTop:4}}/>

        <div style={{marginTop:16}}>
          <label style={{display:"block", fontSize:12, color:"#6b7280", marginBottom:4}}>状態</label>
          <select value={t.status} onChange={e=>setT({...t, status: e.target.value as any})}
                  style={{border:"1px solid #e5e7eb", borderRadius:6, padding:"8px"}}>
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
          </select>
        </div>

        {error && <div style={{marginTop:12, color:"#b91c1c"}}>{error}</div>}

        <div style={{display:"flex", gap:8, marginTop:16}}>
          <button onClick={onSave} disabled={saving}
            style={{background:"#2563eb", color:"#fff", border:"none", borderRadius:6, padding:"10px 14px"}}>
            {saving ? "保存中..." : "保存"}
          </button>
          <button onClick={()=>router.refresh()}
            style={{background:"#eef2ff", color:"#374151", border:"1px solid #e5e7eb", borderRadius:6, padding:"10px 14px"}}>
            変更を破棄
          </button>
        </div>
      </div>

      <aside style={{border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", padding:16}}>
        <div style={{fontSize:12, color:"#6b7280"}}>作成日時</div>
        <div style={{marginBottom:12}}>{new Date(t.createdAt).toLocaleString()}</div>
        <div style={{fontSize:12, color:"#6b7280"}}>作成者</div>
        <div style={{marginBottom:12}}>{t.createdBy || "-"}</div>
        <hr style={{border:"none", borderTop:"1px solid #e5e7eb", margin:"12px 0"}}/>
        <button onClick={onDelete} disabled={saving}
          style={{background:"#fee2e2", color:"#b91c1c", border:"1px solid #fecaca", borderRadius:6, padding:"10px 14px", width:"100%"}}>
          削除
        </button>
      </aside>
    </div>
  );
}