import { proxyToFunc, runtime } from "../../_proxy";
export { runtime };

// Next.js 15: context.params が Promise になる型推論
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