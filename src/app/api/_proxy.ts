/** Azure Functions 邵ｺ・ｸ邵ｺ・ｮ郢晏干ﾎ溽ｹｧ・ｭ郢ｧ・ｷ陷茨ｽｱ鬨ｾ螟ｲ・ｼ莠･・ｰ繝ｻ谺ｧ郢晢ｽｻ陜吝唱・ｮ迚吶・ + undici郢晁ｼ斐°郢晢ｽｼ郢晢ｽｫ郢晁・繝｣郢ｧ・ｯ隴崢驍ｨ繧画ｲｿ繝ｻ繝ｻ *  - 陞ｳ貅ｯ・｡譴ｧ蜃ｾ env 邵ｺ・ｯ bracket 髫ｪ菫ｶ・ｳ霈斐帝坡・ｭ郢ｧﾂ繝ｻ繝ｻWA邵ｺ・ｧ郢ｧ繧会ｽ｢・ｺ陞ｳ貊ゑｽｼ繝ｻ *  - hop-by-hop 驕ｲ蟲ｨ繝ｻ驕問扱・ｭ・｢郢晏･繝｣郢敖郢晢ｽｼ郢ｧ蟶晏求陷ｴ・ｻ繝ｻ繝ｻxpect:100-continue 郢ｧ雋橸ｽｿ繝ｻ笘・梨・ｽ邵ｺ・ｨ邵ｺ蜻ｻ・ｼ繝ｻ *  - JSON 邵ｺ・ｯ隴√・・ｭ諤懊・邵ｺ・ｮ邵ｺ・ｾ邵ｺ・ｾ雋ゑｽ｡邵ｺ蜻ｻ・ｼ繝ｻontent-Type: application/json 郢ｧ蜻医・驕会ｽｺ繝ｻ繝ｻ *  - fetch(undici) 邵ｺ謔滂ｽ､・ｱ隰ｨ蜉ｱ・邵ｺ貅假ｽ・node:http/https 邵ｺ・ｧ陷蝓ｼﾂ繝ｻ *  - x-proxy-sig 邵ｺ・ｧ驍ｨ迹夲ｽｷ・ｯ郢ｧ雋槫ｺ・囎髢蝟ｧ繝ｻ繝ｻ9-undici / v9-fallback-nodehttps / v9-error繝ｻ繝ｻ */

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

/** 髴・ｽ｢鬨ｾ竏夲ｼ邵ｺ・ｪ邵ｺ繝ｻ・ｼ蛹ｻ笘・ｹｧ荵昶・陞｢鄙ｫ・檎ｹｧ蜈ｷ・ｼ蟲ｨ繝ｻ郢昴・繝郢晢ｽｼ */
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
  "expect", // 遶翫・iwr 邵ｺ蠕｡・ｻ蛟･・郢ｧ荵昶・ undici 邵ｺ迹夊ｪ邵ｺ・｡郢ｧ繝ｻ]);

/** Headers 遶翫・驍擾｣ｰ邵ｺ・ｮ郢ｧ・ｪ郢晄じ縺夂ｹｧ・ｧ郢ｧ・ｯ郢晁肩・ｼ驛∬ｪ邵ｺ・ｨ邵ｺ蜷ｶ竏狗ｸｺ髦ｪ繝ｻ髣懶ｽｽ邵ｺ・ｨ邵ｺ蜻ｻ・ｼ繝ｻ*/
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
    u.searchParams.get("code") ||                 // 郢ｧ・ｯ郢ｧ・ｨ郢晢ｽｪ繝ｻ蛹ｻ繝ｦ郢ｧ・ｹ郢晁ご逡代・繝ｻ    req.headers.get("x-functions-key") ||         // 郢晏･繝｣郢敖繝ｻ蛹ｻ繝ｦ郢ｧ・ｹ郢晁ご逡代・繝ｻ    req.headers.get("x-func-key") ||
    req.headers.get("x-api-key") ||
    process.env["FUNC_KEY"] ||                    // SWA 邵ｺ・ｮ髫ｪ・ｭ陞ｳ繝ｻ    process.env["API_KEY"] ||
    process.env["ASSIST_FUNC_KEY"] ||
    undefined
  );
}

function buildFuncUrl(path: string, key?: string): string {
  const base = getBase();
  if (!base) throw new Error("FUNC_BASE / API_BASE / NEXT_PUBLIC_API_BASE_URL is empty");
  const norm = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = new URL(path, norm);
  if (key) url.searchParams.set("code", key); // 陷驤ｴ閨櫁峪蜴・ｽｼ蛹ｻ縺醍ｹｧ・ｨ郢晢ｽｪ邵ｺ・ｫ郢ｧ繧奇ｽｼ蟲ｨ笳狗ｹｧ蜈ｷ・ｼ繝ｻ  return url.toString();
}

/** undici(fetch) 郢晁ｼ斐°郢晢ｽｼ郢晢ｽｫ郢晁・繝｣郢ｧ・ｯ */
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
          h.set("x-proxy-sig", "v10-fallback-nodehttps");
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

    // 髴・ｽ｢鬨ｾ竏壹・郢昴・繝繝ｻ閧ｲ・ｦ竏ｵ・ｭ・｢郢晏･繝｣郢敖邵ｺ・ｯ髣懶ｽｽ邵ｺ・ｨ邵ｺ蜻ｻ・ｼ繝ｻ    const headersObj = sanitizeToObject(req.headers);
    headersObj["accept-encoding"]="identity"; if (key) headersObj["x-functions-key"] = key; // 陷驤ｴ閨櫁峪蜴・ｽｼ蛹ｻ繝ｻ郢昴・繝邵ｺ・ｫ郢ｧ繧奇ｽｼ蟲ｨ笳狗ｹｧ蜈ｷ・ｼ繝ｻ    delete headersObj["Expect"]; // 陟｢・ｵ邵ｺ・ｮ邵ｺ貅假ｽ∬棔・ｧ隴√・・ｭ遉ｼ豐ｿ郢ｧ繧句求陷ｴ・ｻ
    delete headersObj["expect"];

    // Body 郢ｧ蜻茨ｽｭ・｣髫穂ｸ槫密
    let bodyInit: string | ArrayBuffer | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const ct = req.headers.get("content-type") || "";
      if (isJson(ct)) {
        // JSON 邵ｺ・ｯ隴√・・ｭ諤懊・邵ｺ・ｧ繝ｻ繝ｻharset 邵ｺ・ｯ闔牙･・邵ｺ・ｪ邵ｺ繝ｻ・ｼ繝ｻ        const text = await req.text();
        bodyInit = text && text.length ? text : "{}";
        headersObj["content-type"] = "application/json";
      } else {
        bodyInit = await req.arrayBuffer();
      }
    }

    // 邵ｺ・ｾ邵ｺ繝ｻfetch(undici)
    try {
      const res = await fetch(url, {
        method,
        headers: headersObj,
        body: bodyInit as any,
      });
      const h = new Headers(res.headers);
      h.delete("transfer-encoding"); h.delete("content-encoding"); h.delete("content-length"); h.delete("content-encoding"); h.delete("content-length");
      h.set("x-proxy-sig", "v10-undici");
      return new Response(res.body, { status: res.status, headers: h });
    } catch (e: any) {
      // e.cause.code 邵ｺ・ｫ陷茨ｽ･郢ｧ荵昴％郢晢ｽｼ郢ｧ・ｹ郢ｧ蜻磯升邵ｺ繝ｻ      const code = e?.code || e?.cause?.code || "";
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