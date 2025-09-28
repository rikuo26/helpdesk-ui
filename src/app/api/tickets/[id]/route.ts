export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

type P = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: P) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}
export async function PATCH(req: Request, { params }: P) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}
export async function PUT(req: Request, { params }: P) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}
export async function DELETE(req: Request, { params }: P) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}