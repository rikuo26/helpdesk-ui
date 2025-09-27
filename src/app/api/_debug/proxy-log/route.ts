import { NextResponse } from "next/server";
import { readProxyLogTail } from "@/lib/serverLogger";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const n = parseInt(searchParams.get("lines") || "200", 10);
  const text = await readProxyLogTail(Number.isFinite(n) ? n : 200);
  return new NextResponse(text, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
}