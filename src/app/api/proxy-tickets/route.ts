import { NextResponse } from "next/server";

function base() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) throw new Error("API base is not configured on server.");
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function GET() {
  const r = await fetch(`${base()}/api/tickets`, { cache: "no-store" });
  return new NextResponse(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" }});
}

export async function POST(req: Request) {
  const body = await req.text();
  const r = await fetch(`${base()}/api/tickets`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return new NextResponse(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" }});
}
