"use client";

import React, { useState } from "react";
import { apiPost, updateTicket, deleteTicket } from "@/lib/api";

function fmt(s?: string) {
  if (!s) return "";
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

export default function EditorClient({
  id,
  initial,
}: {
  id: string;
  initial: { id: string; title: string; description: string; createdAt?: string };
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [desc, setDesc]   = useState(initial.description ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState<string | null>(null);
  const [info, setInfo]     = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(null); setInfo(null);
    try {
      const r = await updateTicket(id, { title, description: desc });
      setInfo("Saved");
      setTitle(r.title ?? title);
      setDesc(r.description ?? desc);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this ticket?")) return;
    try {
      await deleteTicket(id);
      location.href = "/tickets";
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <a href="/tickets">← Back to list</a>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 16px" }}>Admin: Ticket Detail</h1>

      <div style={{ marginBottom: 12 }}>
        <div><b>ID:</b> {initial.id}</div>
        <div><b>Created:</b> {fmt(initial.createdAt)}</div>
      </div>

      <form onSubmit={onSave} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Title
            <input value={title} onChange={e=>setTitle(e.target.value)} required
                   style={{ display:"block", width:"100%", padding:8, marginTop:4 }} />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Description
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} required
                      style={{ display:"block", width:"100%", padding:8, marginTop:4 }} />
          </label>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button type="submit" disabled={saving} style={{ padding:"8px 16px" }}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onDelete} style={{ padding:"8px 16px" }}>
            Delete
          </button>
        </div>
        {info && <p style={{ color:"green", marginTop:12 }}>{info}</p>}
        {err  && <p style={{ color:"crimson", marginTop:12 }}>Error: {err}</p>}
      </form>
    </main>
  );
}