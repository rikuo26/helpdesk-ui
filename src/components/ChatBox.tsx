"use client";
import { useState } from "react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; ts: number };

export default function ChatBox() {
  const [thread, setThread] = useState<Message[]>([]);
  const [input, setInput]   = useState("");
  const [busy, setBusy]     = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, ts: Date.now() };
    setThread(prev => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const r = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content }] })
      });
      const data  = await r.json().catch(() => ({}));
      const reply = (data?.reply ?? "").toString().trim() || "すみません、応答を取得できませんでした。";
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: reply, ts: Date.now() };
      setThread(prev => [...prev, aiMsg]);
    } catch (e: any) {
      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: `エラー: ${e?.message || "送信に失敗しました"}`, ts: Date.now() };
      setThread(prev => [...prev, aiMsg]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{display:"grid", gap:12}}>
      <div style={{minHeight:120, border:"1px solid #ddd", padding:12}}>
        {thread.map(m => (
          <p key={m.id}><strong>{m.role === "user" ? "あなた" : "AI"}:</strong> {m.content}</p>
        ))}
      </div>
      <form onSubmit={onSubmit} style={{display:"flex", gap:8}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力"
          disabled={busy}
          style={{flex:1}}
        />
        <button disabled={busy || !input.trim()} type="submit">送信</button>
      </form>
    </div>
  );
}