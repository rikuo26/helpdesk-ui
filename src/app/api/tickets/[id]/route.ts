import { NextResponse } from "next/server";
import { readOverrides, upsertOverride, applyOverrideToItem } from "@/lib/ticketLocalStore";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

function env(): { base: string; key: string } {
  const base = process.env.API_BASE || process.env.FUNC_BASE;
  const key  = process.env.API_KEY  || process.env.FUNC_KEY;
  if (!base || !key) throw new Error("FUNC_BASE / FUNC_KEY (or API_BASE / API_KEY) missing");
  return { base: base.replace(/\/$/,""), key };
}
async function getId(ctx:any) {
  const p = ctx?.params; if (p && typeof p.then === "function") { const v = await p; return String(v?.id ?? ""); }
  return String(p?.id ?? "");
}
async function fetchOne(base: string, key: string, id: string) {
  const url = `${base}/tickets/${encodeURIComponent(id)}?code=${encodeURIComponent(key)}`;
  try {
    const r = await fetch(url, { cache:"no-store" as any, headers:{ "x-functions-key": key }});
    const text = await r.text();
    return { ok: r.ok, status: r.status, text };
  } catch (e:any) { return { ok:false, status:502, text: e?.message || "fetch failed" }; }
}

export async function GET(_: Request, ctx:any) {
  const { base, key } = env(); const id = await getId(ctx);
  const { text } = await fetchOne(base, key, id);
  try {
    const obj = text ? JSON.parse(text) : {};
    const ov  = (await readOverrides())[id];
    const merged = applyOverrideToItem((obj && typeof obj === "object") ? obj : { id }, ov);
    if (!(merged as any).id) (merged as any).id = id;
    return NextResponse.json(merged, { status: 200 });
  } catch {
    const ov = (await readOverrides())[id] ?? {};
    return NextResponse.json({ id, ...ov }, { status: 200 });
  }
}

async function handleUpdate(method: "PATCH"|"PUT", req: Request, ctx:any) {
  const { base, key } = env(); const id = await getId(ctx);
  const bodyText = await req.text();

  // 1) まずリモートに挑戦
  const url = `${base}/tickets/${encodeURIComponent(id)}?code=${encodeURIComponent(key)}`;
  try {
    const r = await fetch(url, { method, headers:{ "content-type":"application/json", "x-functions-key": key }, body: bodyText, cache:"no-store" as any });
    const text = await r.text();
    if (r.ok || r.status !== 404) {
      return new NextResponse(text || "", { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json; charset=utf-8" }});
    }
  } catch { /* ignore */ }

  // 2) リモート未実装/404 → ローカル保存（必ず成功）
  let body: any = undefined; try { body = bodyText ? JSON.parse(bodyText) : undefined; } catch {}
  const saved = await upsertOverride(id, { status: body?.status, updatedAt: new Date().toISOString(), updatedBy: "local-override" });

  // 3) 表示用スナップショット（取得できればリモート + 上書き）
  const one = await fetchOne(base, key, id);
  try {
    const obj = one.text ? JSON.parse(one.text) : { id };
    const merged = applyOverrideToItem(obj, saved);
    if (!(merged as any).id) (merged as any).id = id;
    return NextResponse.json(merged, { status: 200 });
  } catch {
    return NextResponse.json({ id, ...saved }, { status: 200 });
  }
}

export async function PATCH(req: Request, ctx:any) { return handleUpdate("PATCH", req, ctx); }
export async function PUT  (req: Request, ctx:any) { return handleUpdate("PUT",   req, ctx); }

export { HEAD, OPTIONS } from "../../_lib/no405";