export type Ticket = { id: string; title: string; description: string; createdAt?: string };
export type TicketInput = { title: string; description: string };

/** 実行時にBASEを取得（クライアントでは未定義の可能性あり） */
function getBase() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return raw ? (raw.endsWith("/") ? raw.slice(0, -1) : raw) : "";
}

/** URL組み立て。BASEが無ければNextのサーバープロキシに流す */
function buildUrl(path: string) {
  const base = getBase();
  if (base) {
    const url = new URL(path, base);
    const key = process.env.NEXT_PUBLIC_API_KEY?.trim();
    if (key) url.searchParams.set("code", key);
    return url.toString();
  }
  // クライアント/本番ビルドでBASEが空なら、自アプリ内のプロキシへ
  if (path.startsWith("/api/tickets/")) {
    return path.replace("/api/tickets/", "/api/proxy-tickets/");
  }
  if (path === "/api/tickets") return "/api/proxy-tickets";
  if (path === "/api/health")  return "/api/health"; // 使う場合は別途用意可
  throw new Error("API base URL is not set (NEXT_PUBLIC_API_BASE_URL).");
}

export async function health() {
  const r = await fetch(buildUrl("/api/health"), { cache: "no-store" });
  if (!r.ok) throw new Error(`health NG: ${r.status}`);
  return r.json();
}

export async function getTickets() {
  const r = await fetch(buildUrl("/api/tickets"), { cache: "no-store" });
  if (!r.ok) throw new Error(`tickets NG: ${r.status}`);
  return r.json() as Promise<Ticket[]>;
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const r = await fetch(buildUrl(`/api/tickets/${encodeURIComponent(id)}`), { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`ticket NG: ${r.status}`);
  return r.json();
}

export async function createTicket(input: TicketInput): Promise<{ id: string }> {
  const r = await fetch(buildUrl("/api/tickets"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`create NG: ${r.status} ${text}`);
  }
  return r.json();
}
