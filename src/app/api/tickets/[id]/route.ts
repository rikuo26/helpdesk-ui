export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return proxyToFunc(req, `/api/tickets/${encodeURIComponent(id)}`);
}