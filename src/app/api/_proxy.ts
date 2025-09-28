/** Azure Functions 縺ｸ縺ｮ繝励Ο繧ｭ繧ｷ蜈ｱ騾夲ｼ亥・欧繝ｻ蝙句ｮ牙・ + undici繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ譛邨ら沿・・ *  - 螳溯｡梧凾 env 縺ｯ bracket 險俶ｳ輔〒隱ｭ繧・・WA縺ｧ繧ら｢ｺ螳滂ｼ・ *  - hop-by-hop 遲峨・遖∵ｭ｢繝倥ャ繝繝ｼ繧帝勁蜴ｻ・・xpect:100-continue 繧貞ｿ・★關ｽ縺ｨ縺呻ｼ・ *  - JSON 縺ｯ譁・ｭ怜・縺ｮ縺ｾ縺ｾ貂｡縺呻ｼ・ontent-Type: application/json 繧呈・遉ｺ・・ *  - fetch(undici) 縺悟､ｱ謨励＠縺溘ｉ node:http/https 縺ｧ蜀埼・ *  - x-proxy-sig 縺ｧ邨瑚ｷｯ繧貞庄隕門喧・・9-undici / v9-fallback-nodehttps / v9-error・・ */

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

/** 霆｢騾√＠縺ｪ縺・ｼ医☆繧九→螢翫ｌ繧具ｼ峨・繝・ム繝ｼ */
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
  "expect", // 竊・iwr 縺御ｻ倥￠繧九→ undici 縺瑚誠縺｡繧・]);

/** Headers 竊・邏縺ｮ繧ｪ繝悶ず繧ｧ繧ｯ繝茨ｼ郁誠縺ｨ縺吶∋縺阪・關ｽ縺ｨ縺呻ｼ・*/
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
    u.searchParams.get("code") ||                 // 繧ｯ繧ｨ繝ｪ・医ユ繧ｹ繝育畑・・    req.headers.get("x-functions-key") ||         // 繝倥ャ繝・医ユ繧ｹ繝育畑・・    req.headers.get("x-func-key") ||
    req.headers.get("x-api-key") ||
    process.env["FUNC_KEY"] ||                    // SWA 縺ｮ險ｭ螳・    process.env["API_KEY"] ||
    process.env["ASSIST_FUNC_KEY"] ||
    undefined
  );
}

function buildFuncUrl(path: string, key?: string): string {
  const base = getBase();
  if (!base) throw new Error("FUNC_BASE / API_BASE / NEXT_PUBLIC_API_BASE_URL is empty");
  const norm = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = new URL(path, norm);
  if (key) url.searchParams.set("code", key); // 蜀鈴聞蛹厄ｼ医け繧ｨ繝ｪ縺ｫ繧りｼ峨○繧具ｼ・  return url.toString();
}

/** undici(fetch) 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ */
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
          h.delete("transfer-encoding"); h.delete("content-encoding"); h.delete("content-length"); h.delete("content-encoding"); h.delete("content-length");
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

    // 霆｢騾√・繝・ム・育ｦ∵ｭ｢繝倥ャ繝縺ｯ關ｽ縺ｨ縺呻ｼ・    const headersObj = sanitizeToObject(req.headers);
    
    headersObj["accept-encoding"] = "identity";
if (key) headersObj["x-functions-key"] = key; // 蜀鈴聞蛹厄ｼ医・繝・ム縺ｫ繧りｼ峨○繧具ｼ・    delete headersObj["Expect"]; // 蠢ｵ縺ｮ縺溘ａ螟ｧ譁・ｭ礼沿繧る勁蜴ｻ
    delete headersObj["expect"];

    // Body 繧呈ｭ｣隕丞喧
    let bodyInit: string | ArrayBuffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const ct = req.headers.get("content-type") || "";
      if (isJson(ct)) {
        // JSON 縺ｯ譁・ｭ怜・縺ｧ・・harset 縺ｯ莉倥￠縺ｪ縺・ｼ・        const text = await req.text();
        bodyInit = text && text.length ? text : "{}";
        headersObj["content-type"] = "application/json";
      } else {
        bodyInit = await req.arrayBuffer();
      }
    }

    // 縺ｾ縺・fetch(undici)
    try {
      const res = await fetch(url, {
        method,
        headers: headersObj,
        body: bodyInit as any,
      });
      const h = new Headers(res.headers);
      h.delete("transfer-encoding"); h.delete("content-encoding"); h.delete("content-length"); h.delete("content-encoding"); h.delete("content-length");
      h.set("x-proxy-sig", "v9-undici");
      return new Response(res.body, { status: res.status, headers: h });
    } catch (e: any) {
      // e.cause.code 縺ｫ蜈･繧九こ繝ｼ繧ｹ繧呈鏡縺・      const code = e?.code || e?.cause?.code || "";
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

