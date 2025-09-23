/** 共通型 */
export type Ticket = {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
};
export type TicketInput = { title: string; description: string };

/** BASE URL を「呼び出し時」に読む */
function getBase() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  // ビルド時は未定義のことがある。実行時（SWA本番/ローカル）で値が入る前提。
  if (!raw) return ""; // ← ここでは例外を投げない
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/** 必要時のみ Function Key を付与 */
function buildUrl(path: string) {
  const base = getBase();
  if (!base) throw new Error("API base URL is not set (NEXT_PUBLIC_API_BASE_URL).");
  const url = new URL(path, base);
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

/** 一覧取得 */
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

/** 作成（未実装時はフォールバックでダミーID） */
export async function createTicket(input: TicketInput): Promise<{ id: string }> {
  const r = await fetch(buildUrl("/api/tickets"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

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
