export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

// Next 15: params は Promise
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const u = new URL(req.url);
  return proxyToFunc(req, `/api/tickets/${id}` + (u.search || ""));
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${id}`);
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${id}`);
}