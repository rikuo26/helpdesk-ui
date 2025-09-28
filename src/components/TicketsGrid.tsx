import { apiGet } from "@/lib/api";
import StatusQuickEdit from "@/components/StatusQuickEdit";

type Ticket = { id:string; title:string; description?:string|null; status:string; createdAt:string; createdBy?:string|null };
type Props = { scope?: "all" | "mine"; admin?: boolean } & Record<string, unknown>;

export default async function TicketsGrid({ scope = "all" }: Props) {
  const list = await apiGet<Ticket[]>(`/tickets?scope=${scope}`, { fallback: [] });
  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>ID</th>
          <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>件名</th>
          <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>状態</th>
          <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>作成日時</th>
          <th style={{ textAlign:"left", borderBottom:"1px solid #ddd", padding:8 }}>作成者</th>
        </tr>
      </thead>
      <tbody>
        {list.map(t => (
          <tr key={t.id}>
            <td style={{ borderBottom:"1px solid #eee", padding:8 }}>{t.id}</td>
            <td style={{ borderBottom:"1px solid #eee", padding:8 }}>{t.title}</td>
            <td style={{ borderBottom:"1px solid #eee", padding:8 }}>
              <StatusQuickEdit id={t.id} value={t.status} />
            </td>
            <td style={{ borderBottom:"1px solid #eee", padding:8 }}>
              {new Date(t.createdAt).toLocaleString("ja-JP", { hour12:false })}
            </td>
            <td style={{ borderBottom:"1px solid #eee", padding:8 }}>{t.createdBy ?? "—"}</td>
          </tr>
        ))}
        {!list.length && <tr><td colSpan={5} style={{ padding:12, color:"#666" }}>データがありません</td></tr>}
      </tbody>
    </table>
  );
}