export type Json = any;

/** ------ 共通: /api/* への相対パス化と fetch ------ */
export function toApiPath(path: string): string {
  let p = (path || "").trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.startsWith("/api/")) p = "/api" + p.replace(/^\/+/, "/");
  return p;
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = toApiPath(path);
  const headers = new Headers(init.headers || {});
  headers.delete("cookie"); // Functions へ送らない
  const res = await fetch(url, { ...init, headers, cache: "no-store" });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const j = await res.clone().json(); if (j?.error) msg += `: ${j.error}`; } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

/** ------ チケット型 ------ */
export type Ticket = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
  createdBy?: string | null;
};

/** ------ 既存 UI が参照するヘルパーを提供（名前は昔のまま） ------ */
export async function getTickets(scope: "all" | "mine" = "all"): Promise<Ticket[]> {
  return apiFetch<Ticket[]>(`/tickets?scope=${encodeURIComponent(scope)}`);
}
export async function listTickets(params?: { scope?: "all" | "mine" }) {
  return getTickets(params?.scope ?? "all");
}

export async function createTicket(input: { title: string; description?: string | null; status?: string }): Promise<Ticket> {
  return apiFetch<Ticket>("/tickets", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function getTicket(id: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${encodeURIComponent(id)}`);
}

export async function updateTicket(
  id: string,
  patch: Partial<Pick<Ticket, "title" | "description" | "status">>
): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/**
 * 旧 UI が呼ぶ delete 用のダミー互換:
 * - Functions 側が DELETE 未実装のため 405 の場合は「done へ更新」で代替
 * - それ以外のエラーは投げる
 */
export async function deleteTicket(id: string): Promise<void> {
  try {
    await apiFetch(`/tickets/${encodeURIComponent(id)}`, { method: "DELETE" as any });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.startsWith("405 ")) {
      await updateTicket(id, { status: "done" }); // ソフトクローズ
      return;
    }
    throw e;
  }
}

/** 管理ダッシュボード用の薄いラッパ（使われなくても害はない） */
export type TicketStats = { total:number; newToday:number; byStatus:Record<string,number>;
  series:{ labels:string[]; counts:number[] } };
export async function getTicketStats(days = 14): Promise<TicketStats> {
  return apiFetch<TicketStats>(`/tickets/stats?days=${encodeURIComponent(String(days))}`);
}
export async function getTicketStatsByUsers(days = 14): Promise<any[]> {
  return apiFetch<any[]>(`/tickets/stats/users?days=${encodeURIComponent(String(days))}`);
}