/** Azure Functions へのプロキシ共通（堅牢・型安全 + undiciフォールバック最終版）
 *  - 実行時 env は bracket 記法で読む（SWAでも確実）
 *  - hop-by-hop 等の禁止ヘッダーを除去（Expect:100-continue を必ず落とす）
 *  - JSON は文字列のまま渡す（Content-Type: application/json を明示）
 *  - fetch(undici) が失敗したら node:http/https で再送
 *  - x-proxy-sig で経路を可視化（v9-undici / v9-fallback-nodehttps / v9-error）
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

export function getBase(): string {
  return (
    process.env["FUNC_BASE"] ??
    process.env["API_BASE"] ??
    process.env["NEXT_PUBLIC_API_BASE_URL"] ??
    ""
  );
}

function isJson(ct: string): boolean {
  return /\bapplication\/json\b/i.test(ct);
}

/** 転送しない（すると壊れる）ヘッダー */
const DROP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "accept-encoding",
  "content-length",
  "expect", // ← iwr が付けると undici が落ちる
]);

/** Headers → 素のオブジェクト（落とすべきは落とす） */
function sanitizeToObject(src: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of src) {
    const lk = k.toLowerCase();
    if (DROP_HEADERS.has(lk)) continue;
    obj[k] = v;
  }
  return obj;
}

function chooseFuncKey(req: Request): string | undefined {
  const u = new URL(req.url);
  return (
    u.searchParams.get("code") ||                 // クエリ（テスト用）
    req.headers.get("x-functions-key") ||         // ヘッダ（テスト用）
    req.headers.get("x-func-key") ||
    req.headers.get("x-api-key") ||
    process.env["FUNC_KEY"] ||                    // SWA の設定
    process.env["API_KEY"] ||
    process.env["ASSIST_FUNC_KEY"] ||
    undefined
  );
}

function buildFuncUrl(path: string, key?: string): string {
  const base = getBase();
  if (!base) throw new Error("FUNC_BASE / API_BASE / NEXT_PUBLIC_API_BASE_URL is empty");
  const norm = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = new URL(path, norm);
  if (key) url.searchParams.set("code", key); // 冗長化（クエリにも載せる）
  return url.toString();
}

/** undici(fetch) フォールバック */
async function nodeRequest(
  urlStr: string,
  init: { method: string; headers: Record<string,string>; body?: string | ArrayBuffer }
): Promise<Response> {
  const u = new URL(urlStr);
  const isHttps = u.protocol === "https:";
  const lib = isHttps ? https : http;

  const headers: Record<string,string> = { ...init.headers };
  let bodyBuf: Buffer | undefined;
  if (typeof init.body === "string") {
    bodyBuf = Buffer.from(init.body, "utf8");
  } else if (init.body instanceof ArrayBuffer) {
    bodyBuf = Buffer.from(init.body);
  }
  if (bodyBuf && !headers["Content-Length"] && !headers["content-length"]) {
    headers["Content-Length"] = String(bodyBuf.byteLength);
  }

  return await new Promise((resolve, reject) => {
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + u.search,
        method: init.method,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const h = new Headers();
          for (const [k, v] of Object.entries(res.headers)) {
            if (Array.isArray(v)) h.set(k, v.join(", "));
            else if (typeof v === "string") h.set(k, v);
          }
          h.delete("transfer-encoding");
          h.set("x-proxy-sig", "v9-fallback-nodehttps");
          resolve(new Response(buf, { status: res.statusCode || 200, headers: h }));
        });
      }
    );
    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

export async function proxyToFunc(req: Request, path: string): Promise<Response> {
  try {
    const method = req.method.toUpperCase();
    const key = chooseFuncKey(req);
    const url = buildFuncUrl(path, key);

    // 転送ヘッダ（禁止ヘッダは落とす）
    const headersObj = sanitizeToObject(req.headers);
    if (key) headersObj["x-functions-key"] = key; // 冗長化（ヘッダにも載せる）
    delete headersObj["Expect"]; // 念のため大文字版も除去
    delete headersObj["expect"];

    // Body を正規化
    let bodyInit: string | ArrayBuffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const ct = req.headers.get("content-type") || "";
      if (isJson(ct)) {
        // JSON は文字列で（charset は付けない）
        const text = await req.text();
        bodyInit = text && text.length ? text : "{}";
        headersObj["content-type"] = "application/json";
      } else {
        bodyInit = await req.arrayBuffer();
      }
    }

    // まず fetch(undici)
    try {
      const res = await fetch(url, {
        method,
        headers: headersObj,
        body: bodyInit as any,
      });
      const h = new Headers(res.headers);
      h.delete("transfer-encoding");
      h.set("x-proxy-sig", "v9-undici");
      return new Response(res.body, { status: res.status, headers: h });
    } catch (e: any) {
      // e.cause.code に入るケースを拾う
      const code = e?.code || e?.cause?.code || "";
      const msg  = String(e?.message || e?.cause?.message || "");
      if (code === "UND_ERR_NOT_SUPPORTED" || /UND_ERR_NOT_SUPPORTED|not supported/i.test(msg)) {
        const res = await nodeRequest(url, { method, headers: headersObj, body: bodyInit });
        return res;
      }
      throw e;
    }
  } catch (e: unknown) {
    const err: any = e;
    return new Response(
      JSON.stringify({
        error: err?.message || String(e),
        code: err?.code || err?.cause?.code || null,
        errno: err?.errno ?? null,
        target: path,
      }),
      { status: 500, headers: { "content-type": "application/json", "x-proxy-sig": "v9-error" } },
    );
  }
}