"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function TicketForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  const descLen = description.trim().length;
  const isValid = title.trim().length > 0 && descLen >= 10;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || busy) return;
    setBusy(true); setMsg(null);

    // 相関ID（サーバにも飛ばす・UIにも表示）
    const cid = (() => {
      try { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
      catch { return `${Date.now()}`; }
    })();

    try {
      const created = await apiFetch<any>("/tickets", {
        method: "POST",
        headers: { "content-type": "application/json", "x-correlation-id": cid },
        body: JSON.stringify({ title: title.trim(), description }),
      });
      const newId = created?.id ?? created?.ticket?.id ?? created?.data?.id ?? "";
      setMsg(`送信しました（相関ID: ${cid}${newId ? `, ID: ${newId}` : ""}）`);
      setTitle(""); setDescription("");
    } catch (err:any) {
      setMsg("送信に失敗しました: " + (err?.message || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
      <div>
        <label style={{display:"block", fontWeight:600}}>件名 <span style={{color:"#ef4444"}}>必須</span></label>
        <input value={title} onChange={e=>setTitle(e.target.value)}
               placeholder="例）アプリの画面が真っ白になる" required
               style={{width:"100%", border:"1px solid #ddd", padding:8, borderRadius:4}} />
      </div>
      <div>
        <label style={{display:"block", fontWeight:600}}>内容 <span style={{color:"#ef4444"}}>必須</span></label>
        <textarea value={description} onChange={e=>setDescription(e.target.value)}
                  placeholder="再現手順、発生頻度、期待する動作、影響範囲など具体的にご記入ください。"
                  rows={6} style={{width:"100%", border:"1px solid #ddd", padding:8, borderRadius:4}} />
        <div style={{fontSize:12, color: descLen>=10 ? "#16a34a" : "#ea580c"}}>
          {descLen>=10 ? "OK" : "10文字以上で具体的にご記入ください"}
        </div>
      </div>
      <div>
        <label style={{display:"block", fontWeight:600}}>添付（任意）</label>
        <div style={{border:"1px dashed #cbd5e1", padding:24, borderRadius:6, color:"#64748b"}}>
          ここにドラッグ＆ドロップ（最大10MB, JPEG/PNG/WebP）※既存のアップロード復旧は別途
        </div>
      </div>
      <div>
        <button type="submit" disabled={!isValid || busy}
                style={{padding:"8px 16px", background:"#2563eb", color:"#fff", borderRadius:6, opacity:(!isValid||busy)?0.6:1}}>
          送信
        </button>
        {msg && <p style={{marginTop:8}}>{msg}</p>}
      </div>
    </form>
  );
}