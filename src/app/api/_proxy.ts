import type { RequestInit } from "next/dist/server/web/spec-extension/request";

function makePrincipal(email: string) {
  const obj = {
    identityProvider: "aad",
    userDetails: email,
    claims: [{ typ: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", val: email }],
  };
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

export async function proxyToFunc(req: Request, funcPath: string) {
  const base = process.env.FUNC_BASE!;
  const key  = process.env.FUNC_HOST_KEY!;

  const url = new URL(`${base}${funcPath}`);
  if (!url.searchParams.has("code")) url.searchParams.set("code", key);

  // サニタイズ済みヘッダのみ転送
  const headers = new Headers();
  headers.set("content-type", "application/json");

  const incomingPrincipal = req.headers.get("x-ms-client-principal");
  if (incomingPrincipal) {
    headers.set("x-ms-client-principal", incomingPrincipal);
  } else if (process.env.NODE_ENV !== "production") {
    const email = process.env.DEV_EMAIL || "guest@example.com";
    headers.set("x-ms-client-principal", makePrincipal(email));
  }

  const method = req.method || "GET";
  const init: RequestInit = { method, headers, cache: "no-store" };
  if (method !== "GET" && method !== "HEAD") init.body = await req.text();

  const r = await fetch(url.toString(), init);
  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { "content-type": r.headers.get("content-type") ?? "application/json" },
  });
}
