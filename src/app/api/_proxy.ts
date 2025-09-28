export async function proxyToFunc(req: Request, funcPath: string) {
  const base = (process.env.FUNC_BASE
    || process.env.SELF_BASE
    || process.env.PUBLIC_BASE_URL
    || "").replace(/\/+$/,"");
  if (!base) {
    return new Response(JSON.stringify({ error:"FUNC_BASE is not configured" }), {
      status: 500,
      headers: { "content-type":"application/json" }
    });
  }
  const url = `${base}${funcPath.startsWith("/") ? "" : "/"}${funcPath}`;
  const method = req.method || "GET";
  const h = new Headers(req.headers);

  // Functions 側は authLevel:function。ホストキーがあれば付与
  const hostKey = process.env.FUNC_HOST_KEY || process.env.FUNCTIONS_API_KEY;
  if (hostKey && !h.has("x-functions-key")) h.set("x-functions-key", hostKey);

  // 余計な Cookie は落とす（匿名 API 安定化）
  h.delete("cookie");

  const body = (method === "GET" || method === "HEAD") ? undefined : await req.arrayBuffer().catch(async () => (await req.text()) as any);
  const r = await fetch(url, { method, headers: h, body, redirect: "manual", cache:"no-store" });

  // レスポンスはパススルー（content-type/ステータスを保持）
  const respHeaders = new Headers(r.headers);
  return new Response(r.body, { status: r.status, headers: respHeaders });
}