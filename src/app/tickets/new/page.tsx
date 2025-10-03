"use client";
import { useState } from "react";

export default function NewTicketPage() {
  const [title,setTitle] = useState("");
  const [description,setDescription] = useState("");
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await fetch("/api/tickets", {
      method: "POST",
      headers: { "content-type":"application/json" },
      body: JSON.stringify({ title, description })
    });
    const json = await r.json().catch(()=> ({}));
    if (!r.ok) {
      setMsg("送信に失敗しました: " + (json?.error ?? r.statusText));
    } else {
      setMsg("送信しました。");
      setTitle(""); setDescription("");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} style={{display:"grid",gap:12}}>
      <label>件名<input value={title} onChange={e=>setTitle(e.target.value)} required /></label>
      <label>内容<textarea value={description} onChange={e=>setDescription(e.target.value)} /></label>
      <button disabled={busy} type="submit">送信</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}

