/** Azure Functions へのプロキシ共通（堅牢・型安全 + undiciフォールバック）
 *  - 実行時 env は bracket 記法で読む（SWAでも確実）
 *  - hop-by-hop 等の禁止ヘッダーを除去（Expect:100-continue を必ず落とす）
 *  - まず fetch(undici) で送る。失敗（UND_ERR_NOT_SUPPORTED 等）時は node:https/http で再送
 *  - 返信には常に x-proxy-sig を付加（デプロイ確認用）
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

/** 転送しないヘッダー */
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
  "expect", // ← これがあると undici が UND_ERR_NOT_SUPPORTED で落ちる
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

function headersObjectToHeaders(obj: Record<string,string>): Headers {
  const h = new Headers();
  for (const [k,v] of Object.entries(obj)) h.set(k, v);
  return h;
}

function chooseFuncKey(req: Request): string | undefined {
  const u = new URL(req.url);
  return (
    u.searchParams.get("code") ||                 // クエリ優先（テスト用）
    req.headers.get("x-functions-key") ||         // ヘッダ（テスト用）
    req.headers.get("x-func-key") ||
    req.headers.get("x-api-key") ||
    process.env["FUNC_KEY"] ||                    // SWA の環境変数
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

/** undici(fetch) が不調の時に使うフォールバック実装 */
async function nodeRequest(
  urlStr: string,
  init: { method: string; headers: Record<string,string>; body?: string | ArrayBuffer }
): Promise<Response> {
  const u = new URL(urlStr);
  const isHttps = u.protocol === "https:";
  const lib = isHttps ? https : http;

  // Content-Length は明示したほうが一部の経路で安定する
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
          h.set("x-proxy-sig", "v8-fallback-nodehttps"); // 署名
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

    // 転送ヘッダ（落とすべきものは落とす）
    const headersObj = sanitizeToObject(req.headers);
    if (key) headersObj["x-functions-key"] = key; // 冗長化（ヘッダにも載せる）
    delete headersObj["Expect"]; // 大文字で来ても念のため
    delete headersObj["expect"];

    // BodyInit を string or ArrayBuffer に正規化
    let bodyInit: string | ArrayBuffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const ct = req.headers.get("content-type") || "";
      if (isJson(ct)) {
        const text = await req.text();
        bodyInit = text && text.length ? text : "{}";
        headersObj["content-type"] = "application/json; charset=utf-8";
      } else {
        bodyInit = await req.arrayBuffer();
      }
    }

    // まず fetch(undici) で試す
    try {
      const res = await fetch(url, {
        method,
        headers: headersObj,
        body: bodyInit as any, // Node fetch は string/ArrayBuffer を受け付ける
      });
      const h = new Headers(res.headers);
      h.delete("transfer-encoding");
      h.set("x-proxy-sig", "v8-undici"); // 署名
      return new Response(res.body, { status: res.status, headers: h });
    } catch (e: any) {
      // undici が嫌がるとき（UND_ERR_NOT_SUPPORTED など）はフォールバック
      if (e?.code === "UND_ERR_NOT_SUPPORTED" || /not supported/i.test(String(e?.message || ""))) {
        const res = await nodeRequest(url, { method, headers: headersObj, body: bodyInit });
        return res;
      }
      throw e;
    }
  } catch (e: unknown) {
    const err = e as any;
    return new Response(
      JSON.stringify({
        error: err?.message || String(e),
        code: err?.code || err?.cause?.code || null,
        errno: err?.errno ?? null,
        target: path,
      }),
      { status: 500, headers: { "content-type": "application/json", "x-proxy-sig": "v8-error" } },
    );
  }
}