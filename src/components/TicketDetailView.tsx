"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Ticket = {
  id: number;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  createdBy?: string | null;
  assignedTo?: string | null;
};

export default function TicketDetailView({ id }: { id: string }) {
  const [t, setT] = useState<Ticket | null>(null);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true); setErr("");
      try {
        const data = await apiGet<Ticket>(`/tickets/${encodeURIComponent(id)}`, { fallback: null as any });
        if (!aborted) setT(data);
      } catch (e:any) {
        if (!aborted) setErr(e?.message ?? "読み込みに失敗しました");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [id]);

  if (loading) return <div style={{padding:12}}>読み込み中...</div>;
  if (err)     return <div style={{padding:12,color:"#b91c1c"}}>エラー: {err}</div>;
  if (!t)      return <div style={{padding:12}}>チケットが見つかりませんでした。</div>;

  const dt = t.createdAt ? new Date(t.createdAt) : null;

  return (
    <div style={{display:"grid", gap:12}}>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
          <h1 style={{fontSize:18, fontWeight:700, margin:0}}>#{t.id} {t.title ?? ""}</h1>
          <span style={{fontSize:12, color:"#2563eb", fontWeight:600}}>{t.status ?? "open"}</span>
        </div>
        <div style={{fontSize:13, color:"#374151", whiteSpace:"pre-wrap"}}>
          {t.description || "(説明なし)"}
        </div>

        <div style={{marginTop:12, display:"grid", gridTemplateColumns:"auto 1fr", rowGap:6, columnGap:10, fontSize:12, color:"#6b7280"}}>
          <div>作成日時</div><div>{dt ? dt.toLocaleString() : "-"}</div>
          <div>作成者</div><div>{t.createdBy || "-"}</div>
          <div>担当</div><div>{t.assignedTo || "-"}</div>
        </div>

        <div style={{marginTop:16, display:"flex", gap:8}}>
          <a href="/mypage" style={{fontSize:12, color:"#2563eb"}}>← マイページへ戻る</a>
        </div>
      </div>
    </div>
  );
}