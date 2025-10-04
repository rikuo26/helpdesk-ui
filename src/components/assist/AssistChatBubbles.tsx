"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { id:string; role:"user"|"assistant"; content:string; ts:number };

export default function AssistChatBubbles(){
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // オートスクロール
  useEffect(()=>{ scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs.length, busy]);

  async function onSubmit(e?:React.FormEvent){
    e?.preventDefault();
    const content = text.trim();
    if (!content || busy) return;

    // 送信 → クリア
    const me: Msg = { id: crypto.randomUUID(), role:"user", content, ts: Date.now() };
    setMsgs(prev => [...prev, me]);
    setText(""); setBusy(true);

    try{
      const res = await fetch("/api/assist", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ messages:[{ role:"user", content }] })
      });
      const json = await res.json().catch(()=> ({} as any));
      const reply = (json?.reply ?? json?.answer ?? "").toString().trim()
        || "すみません、応答を取得できませんでした。";
      const bot: Msg = { id: crypto.randomUUID(), role:"assistant", content: reply, ts: Date.now() };
      setMsgs(prev => [...prev, bot]);
    }catch(err:any){
      const bot: Msg = { id: crypto.randomUUID(), role:"assistant",
        content: `エラー: ${err?.message ?? "送信に失敗しました"}`, ts: Date.now() };
      setMsgs(prev => [...prev, bot]);
    }finally{ setBusy(false); }
  }

  function Bubble({m}:{m:Msg}){
    const mine = m.role === "user";
    return (
      <div style={{ display:"flex", justifyContent: mine? "flex-end":"flex-start" }}>
        <div style={{
          maxWidth:"72%", padding:"10px 12px", borderRadius:14, lineHeight:1.5,
          color: mine? "#fff":"#111827",
          background: mine? "#2563eb":"#f3f4f6",
          boxShadow:"0 1px 2px rgba(0,0,0,.05)",
          whiteSpace:"pre-wrap", wordBreak:"break-word"
        }}>
          {m.content}
        </div>
      </div>
    );
  }

  return (
    <section style={{ display:"grid", gap:12 }}>
      <h2 style={{fontSize:16, fontWeight:800}}>AI 相談チャット（β）</h2>

      <div ref={scrollRef} aria-live="polite"
           style={{minHeight:180, maxHeight:320, overflow:"auto",
                   border:"1px solid #e5e7eb", borderRadius:12, padding:12, background:"#fff"}}>
        {msgs.length===0 && (
          <div style={{ color:"#6b7280", fontSize:13 }}>こちらからサポートに相談できます。</div>
        )}
        <div style={{display:"grid", gap:10}}>
          {msgs.map(m => <Bubble key={m.id} m={m} />)}
          {busy && (
            <div style={{ display:"flex", justifyContent:"flex-start" }}>
              <div style={{
                padding:"8px 10px", borderRadius:14, background:"#f3f4f6",
                color:"#111827", boxShadow:"0 1px 2px rgba(0,0,0,.05)"
              }}>…</div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ display:"flex", gap:8 }}>
        <textarea
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="質問を入力（Enterで送信 / Shift+Enterで改行）"
          disabled={busy}
          onKeyDown={e=>{
            if (e.key==="Enter" && !e.shiftKey){
              e.preventDefault(); (e.currentTarget.form as HTMLFormElement|undefined)?.requestSubmit();
            }
          }}
          style={{
            flex:1, border:"1px solid #e5e7eb", borderRadius:10, padding:"8px 10px",
            minHeight:44, resize:"vertical"
          }}
        />
        <button type="submit" disabled={busy || !text.trim()}
          style={{ padding:"10px 14px", background:"#111827", color:"#fff",
                   border:"none", borderRadius:10, cursor:"pointer", opacity:(busy||!text.trim())?.5:1 }}>
          {busy? "送信中…" : "送信"}
        </button>
      </form>
    </section>
  );
}