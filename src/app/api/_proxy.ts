export const runtime = "nodejs";

/** Function App のベース URL を決定（ENV 優先、なければこの環境の既定） */
function getFuncBase(): string {
  const cand =
    process.env.FUNC_BASE ||
    process.env.NEXT_PUBLIC_FUNC_BASE ||
    process.env.FUNCAPP_BASE ||
    ""; // なければ既定にフォールバック
  const base = (cand || "https://func-helpdesk-k7a.azurewebsites.net").replace(/\/+$/,"");
  return base;
}

export async function proxyToFunc(req: Request, funcPath: string) {
  // ★ Next 自身ではなく「Function App」へ必ず投げる
  const base = getFuncBase();
  const url  = new URL(base + funcPath);

  const method = req.method || "GET";
  const h = new Headers(req.headers);

  // 再帰や CORS のもとになるヘッダーは落とす
  h.delete("cookie");
  h.delete("host");

  // host key を header と query の両方で付与（どちらでも通るように）
  const hostKey =
    process.env.FUNC_HOST_KEY ||
    process.env.FUNCTIONS_HOST_KEY ||
    process.env.FUNC_CODE; // 任意
  if (hostKey) {
    h.set("x-functions-key", hostKey);
    if (!url.searchParams.has("code")) url.searchParams.set("code", hostKey);
  }

  const body = (method === "GET" || method === "HEAD") ? undefined : await req.text();
  const r = await fetch(url.toString(), { method, headers: h, body, redirect: "follow" });

  const respHeaders = new Headers();
  const ct = r.headers.get("content-type");
  if (ct) respHeaders.set("content-type", ct);
  respHeaders.set("x-proxy-target", url.origin);

  const buf = await r.arrayBuffer();
  return new Response(buf, { status: r.status, headers: respHeaders });
}