/** Azure Functions へのプロキシ共通 (TypeScript厳密化) */
export function getBase(): string {
  return (
    process.env.FUNC_BASE ??
    process.env.API_BASE ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    ""
  );
}

function buildFuncUrl(path: string): URL {
  const base = getBase();
  if (!base) {
    throw new Error("FUNC_BASE / API_BASE / NEXT_PUBLIC_API_BASE_URL is empty");
  }
  const normBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = new URL(path, normBase);
  const key = process.env.FUNC_KEY || process.env.API_KEY;
  if (key) url.searchParams.set("code", key);
  return url;
}

export async function proxyToFunc(req: Request, path: string): Promise<Response> {
  try {
    const target = buildFuncUrl(path);

    const init: RequestInit = {
      method: req.method,
      headers: new Headers(req.headers),
    };

    if (!["GET", "HEAD"].includes(req.method.toUpperCase())) {
      const ct = req.headers.get("content-type") || "";
      init.body = ct.includes("application/json") ? await req.text() : req.body ?? null;
    }

    const r = await fetch(target, init);
    const headers = new Headers(r.headers);
    headers.delete("transfer-encoding");

    return new Response(r.body, { status: r.status, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}