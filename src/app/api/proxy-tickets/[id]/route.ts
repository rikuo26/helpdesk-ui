import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

function env(): { base: string; key: string } {
  const base = process.env.API_BASE || process.env.FUNC_BASE;
  const key  = process.env.API_KEY  || process.env.FUNC_KEY;
  if (!base || !key) throw new Error("FUNC_BASE / FUNC_KEY (or API_BASE / API_KEY) missing");
  return { base: base!.replace(/\/$/,""), key: key! };
}
async function getId(ctx:any) {
  const p = ctx?.params; if (p && typeof p.then === "function") { const v = await p; return String(v?.id ?? ""); }
  return String(p?.id ?? "");
}

export async function GET(_: Request, ctx:any) {
  const { base, key } = env(); const id = await getId(ctx);
  const url = `${base}/tickets/${encodeURIComponent(id)}?code=${encodeURIComponent(key)}`;
  const r = await fetch(url, { cache: "no-store" as any, headers: { "x-functions-key": key }});
  const t = await r.text();
  return new NextResponse(t, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json; charset=utf-8" }});
}

async function writeLike(method:"PATCH"|"PUT"|"DELETE", req: Request, ctx:any) {
  const { base, key } = env(); const id = await getId(ctx);
  const body = method === "DELETE" ? undefined : await req.text();
  const url  = `${base}/tickets/${encodeURIComponent(id)}?code=${encodeURIComponent(key)}`;
  const r = await fetch(url, { method, cache:"no-store" as any, headers:{ "x-functions-key": key, ...(body ? { "content-type":"application/json" } : {}) }, body });
  const t = await r.text();
  return new NextResponse(t, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json; charset=utf-8" }});
}

export async function PATCH(req: Request, ctx:any) { return writeLike("PATCH", req, ctx); }
export async function PUT  (req: Request, ctx:any) { return writeLike("PUT",   req, ctx); }
export async function DELETE(req: Request, ctx:any) { return writeLike("DELETE", req, ctx); }

export { HEAD, OPTIONS } from "../../_lib/no405";