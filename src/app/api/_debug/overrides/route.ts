import { NextResponse } from "next/server";
import { readOverrides } from "@/lib/ticketLocalStore";
export const dynamic = "force-dynamic"; export const runtime = "nodejs";
export async function GET() {
  const json = await readOverrides();
  return new NextResponse(JSON.stringify(json, null, 2), { status: 200, headers: { "content-type":"application/json; charset=utf-8" }});
}

