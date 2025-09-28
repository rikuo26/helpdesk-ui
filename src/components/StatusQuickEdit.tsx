"use client";
import { useState } from "react";

const OPTIONS = ["open","in_progress","done"] as const;

export default function StatusQuickEdit(
  { id, value, onChanged }:
  { id: string; value: string; onChanged?: (v: string) => void }
) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setV(next);
    setBusy(true);
    try {
      const r = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      onChanged?.(next);
    } catch (err) {
      // 失敗したら表示だけ元に戻す
      setV(value);
      console.error("update failed", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select value={v} onChange={onChange} disabled={busy}>
      {OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}