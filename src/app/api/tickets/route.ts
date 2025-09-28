export const runtime = "nodejs";
import { proxyToFunc } from "../_proxy";

export async function GET(req) {
  const u = new URL(req.url);
  return proxyToFunc(req, "/api/tickets" + (u.search || ""));
}
export async function POST(req) {
  return proxyToFunc(req, "/api/tickets");
}