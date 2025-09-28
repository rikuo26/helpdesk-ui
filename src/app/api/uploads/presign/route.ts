export const runtime = "nodejs";
import { proxyToFunc } from "../../_proxy";

export async function POST(req: Request) {
  return proxyToFunc(req, "/api/uploads/presign");
}
