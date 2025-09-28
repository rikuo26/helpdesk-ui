export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

type Ctx = { params: Promise<{ id: string }> };

function pathOf(id: string) {
  return `/api/tickets/${encodeURIComponent(id)}`;
}

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToFunc(req, pathOf(id));
}
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToFunc(req, pathOf(id));
}
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToFunc(req, pathOf(id));
}
export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToFunc(req, pathOf(id));
}