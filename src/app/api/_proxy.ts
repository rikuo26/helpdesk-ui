/** Azure Functions へのプロキシ共通（実行時 env は bracket 記法で読む） */
export function getBase(): string {
  return (
    process.env["FUNC_BASE"] ??
    process.env["API_BASE"] ??
    process.env["NEXT_PUBLIC_API_BASE_URL"] ??
    ""
  );
}

function buildFuncUrl(path: string): URL {
  const base = getBase();
  if (!base) throw new Error("FUNC_BASE / API_BASE / NEXT_PUBLIC_API_BASE_URL is empty");
  const normBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = new URL(path, normBase);
  const key = process.env["FUNC_KEY"] || process.env["API_KEY"];
  if (key) url.searchParams.set("code", key);
  return url;
}

export async function proxyToFunc(req: Request, path: string): Promise<Response> {
  try {
    const target = buildFuncUrl(path);

    // 元ヘッダをベースに、転送に向かないものを除去
    const fwd = new Headers(req.headers);
    for (const h of ["host","content-length","connection","accept-encoding","transfer-encoding"]) {
      fwd.delete(h);
    }
    const key = process.env["FUNC_KEY"] || process.env["API_KEY"];
    if (key) fwd.set("x-functions-key", key);

    const init: RequestInit = { method: req.method, headers: fwd, cache: "no-store" };

    if (!["GET","HEAD"].includes(req.method.toUpperCase())) {
      const ct = req.headers.get("content-type") || "";
      init.body = ct.includes("application/json") ? await req.text() : req.body ?? null;
    }

    const r = await fetch(target, init);
    const resHeaders = new Headers(r.headers);
    resHeaders.delete("transfer-encoding");
    return new Response(r.body, { status: r.status, headers: resHeaders });
  } catch (e: unknown) {
    const err: any = e;
    const info = {
      error: err?.message || String(e),
      code: err?.code || err?.cause?.code || null,
      errno: err?.errno || null,
      target: path
    };
    return new Response(JSON.stringify(info), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
