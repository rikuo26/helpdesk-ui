/** Common API helpers */
function abs(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_ORIGIN || "http://localhost:3000";
  try { return new URL(path, base).toString(); } catch { return path; }
}

async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(abs(path), init);
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || (typeof data === "string" ? data : `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data as T;
}

export async function apiGet<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, { ...init, method: "GET" });
}
export async function apiPost<TReq = any, TRes = any>(path: string, body?: TReq, init: RequestInit = {}): Promise<TRes> {
  const headers = { "Content-Type": "application/json", ...(init.headers || {}) };
  return request<TRes>(path, { ...init, method: "POST", headers, body: body != null ? JSON.stringify(body) : undefined });
}
export async function apiPatch<TReq = any, TRes = any>(path: string, body?: TReq, init: RequestInit = {}): Promise<TRes> {
  const headers = { "Content-Type": "application/json", ...(init.headers || {}) };
  return request<TRes>(path, { ...init, method: "PATCH", headers, body: body != null ? JSON.stringify(body) : undefined });
}
export async function apiPut<TReq = any, TRes = any>(path: string, body?: TReq, init: RequestInit = {}): Promise<TRes> {
  const headers = { "Content-Type": "application/json", ...(init.headers || {}) };
  return request<TRes>(path, { ...init, method: "PUT", headers, body: body != null ? JSON.stringify(body) : undefined });
}

/** Tickets facade */
export type Ticket = {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: any[];
};

export async function getTickets(params: Record<string, any> = {}): Promise<Ticket[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) { if (v != null) qs.set(k, String(v)); }
  const q = qs.toString();
  return apiGet(`/api/tickets${q ? `?${q}` : ""}`);
}
export async function getTicket(id: string): Promise<Ticket> {
  return apiGet(`/api/tickets/${encodeURIComponent(id)}`);
}
export async function createTicket(data: Partial<Ticket> & { attachments?: any[] } = {}): Promise<Ticket> {
  return apiPost(`/api/tickets`, data);
}
export async function updateTicket(id: string, data: any) {
  return apiPatch(`/api/tickets/${encodeURIComponent(id)}`, data);
}
export async function deleteTicket(id: string) {
  const res = await fetch(abs(`/api/tickets/${encodeURIComponent(id)}`), { method: "DELETE" });
  if (!res.ok) throw new Error((await res.text()) || "deleteTicket failed");
  return true;
}
