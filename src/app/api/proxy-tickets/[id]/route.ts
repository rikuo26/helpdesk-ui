import { NextResponse } from "next/server";

function base() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) throw new Error("API base is not configured on server.");
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  const r = await fetch(`${base()}/api/tickets/${encodeURIComponent(id)}`, { cache: "no-store" });
  return new NextResponse(await r.text(), { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json" }});
}
