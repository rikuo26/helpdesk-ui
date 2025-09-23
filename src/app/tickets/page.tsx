"use client";

import { useEffect, useState } from "react";
import { health, createTicket, listTickets, deleteTicket } from "../../lib/api";

type HealthT = { status: string; service: string; time: string };
type CreatedT = { message: string; data: { id: string; title: string; description: string } };
type Item = { id: string; title: string; description: string; createdAt?: string };

export default function TicketsPage() {
  const [healthJson, setHealthJson] = useState<HealthT | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<CreatedT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  async function reload() {
    setLoadingList(true);
    try {
      const { items } = await listTickets();
      setItems(items ?? []);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    (async () => {
      try { setHealthJson(await health()); } catch (e: any) { setError(e?.message ?? String(e)); }
    })();
    reload();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setResult(null); setLoading(true);
    try {
      const res = await createTicket({ title, description });
      setResult(res); setTitle(""); setDescription(""); await reload();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally { setLoading(false); }
  }

  return (
    <main style={{ maxWidth: 840, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Tickets</h1>

      <section style={{ marginBottom: 24, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Health</h2>
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {healthJson ? JSON.stringify(healthJson, null, 2) : "loading..."}
        </pre>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Create Ticket</h2>
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 8 }}>
              <label>Title
                <input value={title} onChange={(e)=>setTitle(e.target.value)} style={{display:"block",width:"100%",padding:8,marginTop:4}} required />
              </label>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Description
                <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={4} style={{display:"block",width:"100%",padding:8,marginTop:4}} required />
              </label>
            </div>
            <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
          {error && <p style={{ color: "crimson", marginTop: 12 }}>Error: {error}</p>}
          {result && <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{JSON.stringify(result, null, 2)}</pre>}
        </div>

        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 18 }}>Tickets List</h2>
            <button onClick={reload} disabled={loadingList}>Reload</button>
          </div>
          {loadingList ? <p>Loading...</p> : (
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              {items.map((it) => (
                <li key={it.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
                  <div style={{ fontWeight: 600 }}>{it.title}</div>
                  <div style={{ color: "#555" }}>{it.description}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{it.createdAt}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                    <a href={`/tickets/${it.id}`}>Open</a>
                    <button onClick={async ()=>{ await deleteTicket(it.id); await reload(); }} style={{ padding: "4px 8px" }}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {items.length === 0 && <li>no items</li>}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
