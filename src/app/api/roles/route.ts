export const runtime = "nodejs";
import { proxyToFunc } from "../_proxy";

export async function GET(req) {
  return proxyToFunc(req, "/api/roles");
}