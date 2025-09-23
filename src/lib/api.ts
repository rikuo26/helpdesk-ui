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
const BASE = RAW_BASE.endsWith("/") ? RAW_BASE : `${RAW_BASE}/`;

function buildUrl(path: string) {
  const rel = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(rel, BASE);
  const key = process.env.NEXT_PUBLIC_API_KEY?.trim();
  if (key) url.searchParams.set("code", key);
  return url.toString();
}

/** 共通ハンドラ（標準 JSON パース） */
async function handle<T = any>(r: Response, ctx: { method: string; url: string }) {
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`${ctx.method} ${ctx.url} NG: ${r.status} ${r.statusText}${text ? `  Body: ${text}` : ""}`);
  }
  return (await r.json()) as T;
}

/** -------- 画面が期待している API 群 -------- */
export async function health() {
  // 一覧を呼んで 200 なら OK とみなす
  const url = buildUrl("/api/tickets");
  const r = await fetch(url, { cache: "no-store" });
  return handle(r, { method: "GET", url });
}

export async function listTickets(): Promise<{ items: Ticket[] }> {
  const url = buildUrl("/api/tickets");
  const r = await fetch(url, { cache: "no-store" });
  return handle<{ items: Ticket[] }>(r, { method: "GET", url });
}

export async function getTicket(id: string): Promise<Ticket> {
  const url = buildUrl(`/api/tickets/${encodeURIComponent(id)}`);
  const r = await fetch(url, { cache: "no-store" });
  return handle<Ticket>(r, { method: "GET", url });
}

export async function createTicket(input: TicketInput): Promise<Ticket> {
  const url = buildUrl("/api/tickets");
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<Ticket>(r, { method: "POST", url });
}

export async function updateTicket(id: string, input: Partial<TicketInput>): Promise<Ticket> {
  const url = buildUrl(`/api/tickets/${encodeURIComponent(id)}`);
  // まず PATCH、405 なら PUT にフォールバック
  let r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (r.status === 405) {
    r = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }
  return handle<Ticket>(r, { method: "PATCH/PUT", url });
}

export async function deleteTicket(id: string): Promise<boolean> {
  const url = buildUrl(`/api/tickets/${encodeURIComponent(id)}`);
  const r = await fetch(url, { method: "DELETE" });
  if (r.ok || r.status === 204) return true;
  const t = await r.text().catch(() => "");
  throw new Error(`DELETE ${url} NG: ${r.status} ${r.statusText}${t ? `  Body: ${t}` : ""}`);
}

/** 汎用 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const url = buildUrl(path);
  const r = await fetch(url, { cache: "no-store" });
  return handle<T>(r, { method: "GET", url });
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const url = buildUrl(path);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<T>(r, { method: "POST", url });
}
