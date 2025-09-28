/** 共通：Functions へプロキシする小物 */
export const runtime = "nodejs";

function getBase() {
  // 優先順位: FUNC_BASE → API_BASE → NEXT_PUBLIC_API_BASE_URL
  return process.env.FUNC_BASE
      || process.env.API_BASE
      || process.env.NEXT_PUBLIC_API_BASE_URL
      || "";
}

function buildFuncUrl(path: string) {
  const base = getBase();
  if (!base) throw new Error("FUNC_BASE / FUNC_KEY (or API_BASE / API_KEY) missing");

  const url = new URL(path, base.endsWith("/") ? base.slice(0, -1) : base);
  const key = process.env.FUNC_KEY || process.env.API_KEY;
  if (key) url.searchParams.set("code", key);
  return url;
}

export async function proxyToFunc(req: Request, path: string) {
  try {
    const target = buildFuncUrl(path);

    // 元リクエストのメソッド/ヘッダ/ボディをそのまま転送（必要最小限）
    const init: RequestInit = {
      method: req.method,
      headers: new Headers(req.headers),
    };

    // ボディを付けるのは GET/HEAD 以外
    if (!["GET","HEAD"].includes(req.method.toUpperCase())) {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        init.body = await req.text();
      } else {
        // 画像等のアップロードにも耐える
        init.body = req.body;
      }
    }

    const r = await fetch(target, init);
    // Functions 側のヘッダを素直に返す
    const resHeaders = new Headers(r.headers);
    // CORS 由来の跨ぎを避けるため、SWA→ブラウザ は same-origin で返す
    resHeaders.delete("transfer-encoding");
    return new Response(r.body, { status: r.status, headers: resHeaders });
  } catch (e: any) {
    const msg = e?.message || String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
