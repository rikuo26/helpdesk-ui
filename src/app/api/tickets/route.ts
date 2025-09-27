import { NextResponse } from "next/server";
import { readOverrides, applyOverridesToList } from "@/lib/ticketLocalStore";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

type EnvOk = { ok: true;  base: string; key: string };
type EnvNg = { ok: false; msg: string };
function getEnv(): EnvOk | EnvNg {
  const base = process.env.API_BASE || process.env.FUNC_BASE;
  const key  = process.env.API_KEY  || process.env.FUNC_KEY;
  if (!base || !key) return { ok:false, msg:"FUNC_BASE / FUNC_KEY (or API_BASE / API_KEY) missing" };
  return { ok:true, base: base.replace(/\/$/,""), key };
}

export async function GET(req: Request) {
  const cfg = getEnv(); if (!cfg.ok) return NextResponse.json({ error: cfg.msg }, { status: 500 });
  const inUrl = new URL(req.url, "http://local");
  const out   = new URL(cfg.base + "/tickets");
  inUrl.searchParams.forEach((v,k)=> out.searchParams.set(k,v));
  out.searchParams.set("code", cfg.key);

  let text = "[]", status = 200;
  try {
    const r1 = await fetch(out.toString(), { cache:"no-store" as any, headers: { "x-functions-key": cfg.key }});
    text = await r1.text(); status = r1.status;

    // mine が空だったら all にフォールバック
    if (r1.ok && out.searchParams.get("scope") === "mine") {
      try {
        const arr = JSON.parse(text || "[]");
        if (Array.isArray(arr) && arr.length === 0) {
          const out2 = new URL(cfg.base + "/tickets");
          out2.searchParams.set("scope","all");
          out2.searchParams.set("code", cfg.key);
          const r2 = await fetch(out2.toString(), { cache:"no-store" as any, headers: { "x-functions-key": cfg.key }});
          text = await r2.text(); status = r2.status;
        }
      } catch {}
    }
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "fetch failed" }, { status: 502 });
  }

  try {
    const arr = JSON.parse(text || "[]");
    if (Array.isArray(arr)) {
      const ov = await readOverrides();
      const merged = applyOverridesToList(arr, ov);
      return NextResponse.json(merged, { status: 200 });
    }
  } catch {}
  return new NextResponse(text || "[]", { status, headers: { "content-type":"application/json; charset=utf-8" }});
}

export async function POST(req: Request) {
  const cfg = getEnv(); if (!cfg.ok) return NextResponse.json({ error: cfg.msg }, { status: 500 });
  const url  = `${cfg.base}/tickets?code=${encodeURIComponent(cfg.key)}`;
  const body = await req.text();
  const r = await fetch(url, { method:"POST", headers:{ "content-type":"application/json", "x-functions-key": cfg.key }, body, cache:"no-store" as any });
  const text = await r.text();
  return new NextResponse(text || "", { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json; charset=utf-8" }});
}

export { HEAD, OPTIONS } from "../_lib/no405";