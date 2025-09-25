import { NextRequest, NextResponse } from "next/server";
import { updateStatus, type Ticket } from "../../_db";

export const runtime = "nodejs";

/** PATCH /api/tickets/:id { status } */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;   // ← await が必要になった
    const body = await req.json();
    const status = body?.status as Ticket["status"];
    if (!status) return NextResponse.json({ message: "invalid" }, { status: 400 });

    const updated = updateStatus(id, status);
    if (!updated) return NextResponse.json({ message: "not found" }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ message: "error" }, { status: 500 });
  }
}
