export const runtime = "nodejs";
import { proxyToFunc } from "../_proxy";

export async function GET(req: Request) {
  return proxyToFunc(req, "/api/roles");
}

