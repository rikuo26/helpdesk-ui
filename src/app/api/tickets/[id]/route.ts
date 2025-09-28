export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

export async function GET(req, { params }) {
  const { id } = await params; // Next 15: params is Promise
  const u = new URL(req.url);
  return proxyToFunc(req, `/api/tickets/${id}` + (u.search || ""));
}
export async function PATCH(req, { params }) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${id}`);
}
export async function DELETE(req, { params }) {
  const { id } = await params;
  return proxyToFunc(req, `/api/tickets/${id}`);
}