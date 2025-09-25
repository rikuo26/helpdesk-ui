import { NextRequest, NextResponse } from "next/server";
import { list, create } from "../_db";

export const runtime = "nodejs";

/** GET /api/tickets?scope=recent|mine|all */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "recent";
  return NextResponse.json(list(scope), { status: 200 });
}

/** POST /api/tickets { title, description } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.title || !body?.description) {
      return NextResponse.json({ message: "invalid" }, { status: 400 });
    }
    const t = create({ title: body.title, description: body.description });
    return NextResponse.json(t, { status: 201 });
  } catch {
    return NextResponse.json({ message: "error" }, { status: 500 });
  }
}
