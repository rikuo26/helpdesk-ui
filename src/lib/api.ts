export type Json = any;

export function toApiPath(path: string): string {
  let p = (path || "").trim();
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.startsWith("/api/")) p = "/api" + p.replace(/^\/+/,"/");
  return p;
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = toApiPath(path);
  const headers = new Headers(init.headers || {});
  headers.delete("cookie"); // Functions への不要な Cookie は落とす
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