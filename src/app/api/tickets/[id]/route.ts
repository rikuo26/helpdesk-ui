export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

type Ctx = { params: { id: string } };

function pathOf(id: string) {
  return `/api/tickets/${encodeURIComponent(id)}`;
}

export async function GET(req: Request, { params }: Ctx) {
  return proxyToFunc(req, pathOf(params.id));
}
export async function PATCH(req: Request, { params }: Ctx) {
  return proxyToFunc(req, pathOf(params.id));
}
export async function PUT(req: Request, { params }: Ctx) {
  return proxyToFunc(req, pathOf(params.id));
}
export async function DELETE(req: Request, { params }: Ctx) {
  return proxyToFunc(req, pathOf(params.id));
}