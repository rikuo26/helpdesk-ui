import { Buffer } from "buffer";

/**
 * Next の Route Handler から Azure Functions に中継。
 * - x-ms-client-principal を付与（SWA の .auth/me を Base64 化）
 * - x-functions-key を付与（FUNC_HOST_KEY / FUNCTIONS_API_KEY）
 * - 余計な Cookie は落として安定化
 * - 相関ID (x-correlation-id) を自動付与
 */
export async function proxyToFunc(req: Request, funcPath: string) {
  const reqUrl = new URL(req.url);
  const selfBase = (process.env.SELF_BASE
    || process.env.PUBLIC_BASE_URL
    || `${reqUrl.protocol}//${reqUrl.host}`).replace(/\/+$/, "");

  const funcBase = (process.env.FUNC_BASE || selfBase).replace(/\/+$/, "");
  const url = `${funcBase}${funcPath.startsWith("/") ? "" : "/"}${funcPath}`;

  const method = req.method || "GET";
  const inH = new Headers(req.headers);
  const outH = new Headers(inH);

  // Functions ホストキー
  const hostKey = process.env.FUNC_HOST_KEY || process.env.FUNCTIONS_API_KEY;
  if (hostKey && !outH.has("x-functions-key")) outH.set("x-functions-key", hostKey);

  // Cookie は落とす（匿名APIの安定化）
  outH.delete("cookie");

  // SWA 認証の Principal を Functions へ中継
  try {
    const cookie = inH.get("cookie") || "";
    if (cookie) {
      const me = await fetch(`${selfBase}/.auth/me`, { headers: { cookie }, cache: "no-store" });
      if (me.ok) {
        const meJson = await me.json();
        const b64 = Buffer.from(JSON.stringify(meJson)).toString("base64");
        outH.set("x-ms-client-principal", b64);
      }
    }
  } catch { /* 取得失敗時は匿名で継続 */ }

  // 相関ID
  if (!outH.has("x-correlation-id")) {
    const cid = (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    outH.set("x-correlation-id", cid);
  }

  const body = (method === "GET" || method === "HEAD")
    ? undefined
    : await req.arrayBuffer().catch(() => undefined);

  const res = await fetch(url, { method, headers: outH, body, redirect: "manual", cache: "no-store" });
  const resHeaders = new Headers(res.headers);
  return new Response(res.body, { status: res.status, headers: resHeaders });
}