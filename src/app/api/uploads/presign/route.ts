export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

export async function POST(req) {
  return proxyToFunc(req, "/api/uploads/presign");
}
