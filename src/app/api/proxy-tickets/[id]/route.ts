export const runtime = "nodejs";
import { proxyToFunc } from "@/app/api/_proxy";

type Ctx = { params: { id: string } };
const path = (id: string) => `/api/tickets/${encodeURIComponent(id)}`;

// 必要な HTTP メソッドをすべて上流にそのまま委譲
export async function GET   (req: Request, { params }: Ctx) { return proxyToFunc(req, path(params.id)); }
export async function PATCH (req: Request, { params }: Ctx) { return proxyToFunc(req, path(params.id)); }
export async function DELETE(req: Request, { params }: Ctx) { return proxyToFunc(req, path(params.id)); }
export async function PUT   (req: Request, { params }: Ctx) { return proxyToFunc(req, path(params.id)); }
export async function POST  (req: Request, { params }: Ctx) { return proxyToFunc(req, path(params.id)); }