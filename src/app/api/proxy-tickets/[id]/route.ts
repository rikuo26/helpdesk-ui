export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ctx = { params: Promise<{ id: string }> };
const path = (id: string) => `/api/tickets/${encodeURIComponent(id)}`;

async function pass(req: Request, params: Ctx["params"]) {
  const { id } = await params;
  return proxyToFunc(req, path(id));
}

export async function GET   (req: Request, ctx: Ctx) { return pass(req, ctx.params); }
export async function PATCH (req: Request, ctx: Ctx) { return pass(req, ctx.params); }
export async function DELETE(req: Request, ctx: Ctx) { return pass(req, ctx.params); }
export async function PUT   (req: Request, ctx: Ctx) { return pass(req, ctx.params); }
export async function POST  (req: Request, ctx: Ctx) { return pass(req, ctx.params); }