"use client";
import { useState, useRef, useEffect } from "react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; ts: number };

export default function ChatBox() {
  const [thread, setThread] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;

    const me: Message = { id: crypto.randomUUID(), role: "user", content, ts: Date.now() };
    setThread((p) => [...p, me]);
    setInput("");
    setBusy(true);

    try {
      const r = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content }] })
      });
      const data = await r.json().catch(() => ({} as any));
      const reply = (data?.reply ?? data?.answer ?? "").toString().trim() || "すみません、応答を取得できませんでした。";
      const ai: Message = { id: crypto.randomUUID(), role: "assistant", content: reply, ts: Date.now() };
      setThread((p) => [...p, ai]);
    } catch (e: any) {
      const ai: Message = { id: crypto.randomUUID(), role: "assistant", content: `エラー: ${e?.message ?? "送信に失敗しました"}`, ts: Date.now() };
      setThread((p) => [...p, ai]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{display:"grid", gap:12}}>
      <div ref={scRef} style={{minHeight:180,maxHeight:320,overflow:"auto",border:"1px solid #e5e7eb",borderRadius:8,padding:12}}>
        {thread.map(m=>(
          <div key={m.id} style={{margin:"8px 0"}}>
            <div style={{fontSize:12, color:"#6b7280"}}>{m.role==="user"?"あなた":"AI"}</div>
            <div style={{whiteSpace:"pre-wrap"}}>{m.content}</div>
          </div>
        ))}
        {thread.length===0 && <div style={{color:"#888",fontSize:13}}>こちらからサポートに相談できます。</div>}
      </div>
      <form onSubmit={onSubmit} style={{display:"flex", gap:8}}>
        <input
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          placeholder="質問を入力（Enterで送信 / Shift+Enterで改行）"
          disabled={busy}
          onKeyDown={(e)=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); (e.currentTarget.form as HTMLFormElement)?.requestSubmit(); }}}
          style={{flex:1, padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:6}}
        />
        <button type="submit" disabled={busy || !input.trim()} style={{padding:"8px 12px"}}>送信</button>
      </form>
    </div>
  );
}