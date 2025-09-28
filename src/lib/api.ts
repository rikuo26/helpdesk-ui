export type Json = any;

export function toApiPath(path: string): string {
  let p = (path || "").trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.startsWith("/api/")) p = "/api" + p.replace(/^\/+/, "/");
  return p;
}

/** 低レベル共通フェッチ（JSON／Text自動判定） */
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = toApiPath(path);
  const headers = new Headers(init.headers || {});
  headers.delete("cookie"); // Functions への不要な Cookie は落とす
  const res = await fetch(url, { ...init, headers, cache: "no-store" });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.clone().json();
      if (j?.error) msg += `: ${j.error}`;
    } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

/* ---------------------------------------------
   旧UI互換の高レベルAPI（UI全体で使われる想定の関数名）
   --------------------------------------------- */

function isBodyInit(data: any): data is BodyInit {
  return (
    data instanceof FormData ||
    typeof data === "string" ||
    (typeof Blob !== "undefined" && data instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) ||
    (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView && ArrayBuffer.isView(data))
  );
}

export function apiGet<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  return apiFetch<T>(path, { ...init, method: "GET", headers });
}

export function apiDelete<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  return apiFetch<T>(path, { ...init, method: "DELETE", headers });
}

export function apiPost<T = any>(path: string, data?: any, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  let body: BodyInit | undefined;
  if (data !== undefined && data !== null) {
    if (isBodyInit(data)) body = data as BodyInit;
    else { headers.set("content-type", "application/json"); body = JSON.stringify(data); }
  }
  return apiFetch<T>(path, { ...init, method: "POST", headers, body });
}

export function apiPatch<T = any>(path: string, data?: any, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  let body: BodyInit | undefined;
  if (data !== undefined && data !== null) {
    if (isBodyInit(data)) body = data as BodyInit;
    else { headers.set("content-type", "application/json"); body = JSON.stringify(data); }
  }
  return apiFetch<T>(path, { ...init, method: "PATCH", headers, body });
}

export function apiPut<T = any>(path: string, data?: any, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  let body: BodyInit | undefined;
  if (data !== undefined && data !== null) {
    if (isBodyInit(data)) body = data as BodyInit;
    else { headers.set("content-type", "application/json"); body = JSON.stringify(data); }
  }
  return apiFetch<T>(path, { ...init, method: "PUT", headers, body });
}

/* ---------------------------------------------
   既存ページが直接呼んでいるチケット用の薄いラッパ
   --------------------------------------------- */
export type Ticket = {
  id: string; title: string; description?: string | null;
  status: string; createdAt: string; createdBy?: string | null;
};

export const getTicket = (id: string) =>
  apiGet<Ticket>(`/tickets/${encodeURIComponent(id)}`);

export const updateTicket = (id: string, payload: Partial<Ticket>) =>
  apiPatch<Ticket>(`/tickets/${encodeURIComponent(id)}`, payload);

export const deleteTicket = (id: string) =>
  apiDelete<void>(`/tickets/${encodeURIComponent(id)}`);