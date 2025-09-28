export async function proxyToFunc(req: Request, funcPath: string) {
  const base = (process.env.SELF_BASE || process.env.PUBLIC_BASE_URL || "").replace(/\/+$/,"");
  const url  = `${base}${funcPath}`;
  const method = req.method || "GET";
  const h = new Headers(req.headers);

  // Functions 側は authLevel:function のため、ホストキー（あれば）を付与
  const hostKey = process.env.FUNC_HOST_KEY;
  if (hostKey) h.set("x-functions-key", hostKey);

  // 余計な Cookie は落とす（匿名 API を安定させる）
  h.delete("cookie");

  const body = (method === "GET" || method === "HEAD") ? undefined : await req.text();
  const r = await fetch(url, { method, headers: h, body, redirect: "manual" });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" }
  });
}