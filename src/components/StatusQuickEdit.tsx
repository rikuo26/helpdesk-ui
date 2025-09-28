"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

const OPTIONS = ["open","in_progress","done"] as const;

export default function StatusQuickEdit(
  { id, value, onChanged }:
  { id: string; value: string; onChanged?: (v: string) => void }
) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = v;
    setV(next);
    setBusy(true);
    try {
      await apiFetch(`/tickets/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      onChanged?.(next);
    } catch (err) {
      console.error("PATCH failed", err);
      setV(prev); // 失敗時は元に戻す
    } finally {
      setBusy(false);
    }
  }

  return (
    <select value={v} onChange={onChange} disabled={busy}
            style={{ border:"1px solid #ddd", padding:4, borderRadius:4 }}>
      {OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}