import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

type EnvOk = { ok: true;  base: string; key: string };
type EnvNg = { ok: false; msg: string };

function getEnv(): EnvOk | EnvNg {
  const base = process.env.API_BASE || process.env.FUNC_BASE;
  const key  = process.env.API_KEY  || process.env.FUNC_KEY;
  if (!base || !key) {
    return { ok: false as const, msg: "FUNC_BASE / FUNC_KEY (or API_BASE / API_KEY) missing" };
  }
  return { ok: true as const, base, key };
}

export async function GET(req: Request) {
  const cfg = getEnv(); if (!cfg.ok) return NextResponse.json({ error: cfg.msg }, { status: 500 });
  const inUrl = new URL(req.url, "http://local");
  const out   = new URL(cfg.base.replace(/\/$/,"") + "/tickets");
  inUrl.searchParams.forEach((v, k) => out.searchParams.set(k, v));
  out.searchParams.set("code", cfg.key);

  const r = await fetch(out.toString(), { cache: "no-store" as any, headers: { "x-functions-key": cfg.key }});
  const text = await r.text();
  return new NextResponse(text, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json; charset=utf-8" }});
}

export async function POST(req: Request) {
  const cfg = getEnv(); if (!cfg.ok) return NextResponse.json({ error: cfg.msg }, { status: 500 });
  const url  = cfg.base.replace(/\/$/,"") + "/tickets?code=" + encodeURIComponent(cfg.key);
  const body = await req.text();
  const r = await fetch(url, { method:"POST", headers:{ "content-type":"application/json", "x-functions-key": cfg.key }, body, cache: "no-store" as any });
  const text = await r.text();
  return new NextResponse(text, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json; charset=utf-8" }});
}

export { HEAD, OPTIONS } from "../_lib/no405";