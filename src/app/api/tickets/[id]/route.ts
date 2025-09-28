import { proxyToFunc, runtime } from "../../_proxy";
export { runtime };

export async function GET(req: Request, ctx: { params: { id: string }}) {
  const u = new URL(req.url);
  return proxyToFunc(req, `/api/tickets/${ctx.params.id}` + (u.search || ""));
}

export async function PATCH(req: Request, ctx: { params: { id: string }}) {
  return proxyToFunc(req, `/api/tickets/${ctx.params.id}`);
}

export async function DELETE(req: Request, ctx: { params: { id: string }}) {
  return proxyToFunc(req, `/api/tickets/${ctx.params.id}`);
}