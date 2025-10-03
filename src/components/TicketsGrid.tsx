"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Ticket = {
  id:number; title:string; description:string; status:string;
  createdAt:string; createdBy?:string|null;
};

export default function TicketsGrid({ scope, admin = false }: { scope: "mine" | "all"; admin?: boolean }) {
  const [rows, setRows] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const list = await apiGet<Ticket[]>(`/tickets?scope=${scope}`, { fallback: [] as any });
        if (!aborted) setRows(Array.isArray(list) ? list : []);
      } catch (e:any) {
        if (!aborted) setError(e?.message ?? "読み込みに失敗しました");
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [scope]);

  if (loading) return <div style={{padding:12}}>読み込み中...</div>;
  if (error)   return <div style={{padding:12, color:"#b91c1c"}}>{error}</div>;

  if (!rows.length) {
    return (
      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead><tr>
          <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>ID</th>
          <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>件名</th>
          <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>状態</th>
          <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>作成日時</th>
          <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>作成者</th>
        </tr></thead>
        <tbody><tr><td colSpan={5} style={{padding:12,color:"#666"}}>データがありません</td></tr></tbody>
      </table>
    );
  }

  return (
    <table style={{width:"100%", borderCollapse:"collapse"}}>
      <thead><tr>
        <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>ID</th>
        <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>件名</th>
        <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>状態</th>
        <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>作成日時</th>
        <th style={{textAlign:"left", borderBottom:"1px solid #ddd", padding:8}}>作成者</th>
      </tr></thead>
      <tbody>
        {rows.map(t=>(
          <tr key={t.id} style={{borderTop:"1px solid #f3f4f6"}}>
            <td style={{padding:8}}>{t.id}</td>
            <td style={{padding:8}}>{t.title}</td>
            <td style={{padding:8}}>{t.status}</td>
            <td style={{padding:8}}>{new Date(t.createdAt).toLocaleString()}</td>
            <td style={{padding:8}}>{t.createdBy || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}