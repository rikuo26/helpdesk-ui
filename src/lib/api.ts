/** 共通型 */
export type Ticket = {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
};
export type TicketInput = { title: string; description: string };

/** BASE URL 構築 */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
if (!RAW_BASE) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
const BASE = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE;

/** 必要時のみ Function Key を付与 */
function buildUrl(path: string) {
  const url = new URL(path, BASE);
  const key = process.env.NEXT_PUBLIC_API_KEY?.trim();
  if (key) url.searchParams.set("code", key);
  return url.toString();
}

/** ヘルスチェック */
export async function health() {
  const r = await fetch(buildUrl("/api/health"), { cache: "no-store" });
  if (!r.ok) throw new Error(`health NG: ${r.status}`);
  return r.json();
}

/** 一覧取得（MVPでは空配列） */
export async function getTickets() {
  const r = await fetch(buildUrl("/api/tickets"), { cache: "no-store" });
  if (!r.ok) throw new Error(`tickets NG: ${r.status}`);
  return r.json() as Promise<Ticket[]>;
}

/** 単票取得（未実装時は null を返す） */
export async function getTicket(id: string): Promise<Ticket | null> {
  const r = await fetch(buildUrl(`/api/tickets/${encodeURIComponent(id)}`), {
    cache: "no-store",
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`ticket NG: ${r.status}`);
  return r.json();
}

/** 作成（未実装時はフォールバックでダミーIDを返す） */
export async function createTicket(input: TicketInput): Promise<{ id: string }> {
  const r = await fetch(buildUrl("/api/tickets"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  // API未実装（404/405）の間はクライアント側で仮IDを払い出して遷移できるようにする
  if (r.status === 404 || r.status === 405) {
    const fakeId = `local-${Date.now()}`;
    return { id: fakeId };
  }

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`create NG: ${r.status} ${text}`);
  }
  return r.json();
}
