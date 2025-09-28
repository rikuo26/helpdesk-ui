export type Json = any;

// /api/* に正規化
export function toApiPath(path: string): string {
  let p = (path || "").trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.startsWith("/api/")) p = "/api" + p.replace(/^\/+/, "/");
  return p;
}

// 共通 fetch（クライアント/サーバ両対応）
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = toApiPath(path);
  const headers = new Headers(init.headers || {});
  headers.delete("cookie");                // Functions に不要な Cookie は落とす
  const res = await fetch(url, { ...init, headers, cache: "no-store" });

  const ct = res.headers.get("content-type") || "";

  if (!res.ok) {
    let reason = `${res.status} ${res.statusText}`;
    try { const j = await res.clone().json(); if ((j as any)?.error) reason += `: ${(j as any).error}`; } catch {}
    throw new Error(reason);
  }
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  if (ct.includes("text/"))            return (await res.text()) as unknown as T;
  return (await res.arrayBuffer()) as unknown as T; // 想定外はそのまま
}

// ===== 旧UI互換ヘルパー（utils.ts から re-export されます） =====
export async function apiGet<T = any>(path: string, opts: { fallback?: T } = {}): Promise<T> {
  try {
    return await apiFetch<T>(path, { method: "GET" });
  } catch (e) {
    if (Object.prototype.hasOwnProperty.call(opts, "fallback")) return opts.fallback as T;
    throw e;
  }
}
export async function apiPost<T = any>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
}
export async function apiPatch<T = any>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
}
export async function apiPut<T = any>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
}
export async function apiDelete<T = any>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    method: "DELETE",
    headers: { "content-type": "application/json", ...(init.headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...init,
  });
}

// ===== 旧ページ（/tickets/[id]）が直接呼ぶラッパー =====
export async function getTicket(id: string) {
  return apiGet(`/tickets/${encodeURIComponent(id)}`, { fallback: null });
}
export async function updateTicket(id: string, patch: Record<string, unknown>) {
  return apiPatch(`/tickets/${encodeURIComponent(id)}`, patch);
}
export async function deleteTicket(id: string) {
  return apiDelete(`/tickets/${encodeURIComponent(id)}`);
}