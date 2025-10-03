import { headers } from "next/headers";

type Ticket = {
  id:number; title:string; description:string; status:string; createdAt:string; createdBy:string
};

// APP_ORIGIN > ヘッダから復元 の順でオリジンを決める
async function resolveOrigin() {
  const env = process.env.APP_ORIGIN;
  if (env) return env;
  const h = await headers();                 // Next 15 の async Dynamic API
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host  = h.get("x-forwarded-host")  ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function TicketsGrid({ scope }: { scope: "mine" | "all" }) {
  const origin = await resolveOrigin();
  const url = new URL(`/api/tickets?scope=${scope}`, origin);

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) {
    return <div style={{color:"#b91c1c"}}>読み込みに失敗しました（{r.status}）</div>;
  }

  const list: unknown = await r.json();
  const rows = Array.isArray(list) ? (list as Ticket[]) : [];

  if (rows.length === 0) {
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
          <tr key={t.id}>
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