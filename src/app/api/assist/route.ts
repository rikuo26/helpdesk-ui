export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const base = (
      process.env.FUNC_BASE ||
      process.env.NEXT_PUBLIC_FUNC_BASE ||
      "https://func-helpdesk-k7a.azurewebsites.net"
    ).replace(/\/+$/,"");

    const hostKey = process.env.FUNC_HOST_KEY || process.env.FUNC_KEY || "";
    const funcCode = process.env.ASSIST_CODE || process.env.FUNC_CODE || "";

    const body = await req.text();
    const headers = new Headers({ "content-type": "application/json" });
    if (hostKey) headers.set("x-functions-key", hostKey);

    const url = `${base}/api/assist${!hostKey && funcCode ? `?code=${encodeURIComponent(funcCode)}` : ""}`;

    const r = await fetch(url, { method: "POST", headers, body, redirect: "manual" });
    const text = await r.text();

    return new Response(text, {
      status: r.status,
      headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}