export const runtime = "nodejs";
import { proxyToFunc } from "../../../_proxy";

export async function GET(req: Request) {
  const u = new URL(req.url);
  return proxyToFunc(req, `/api/tickets-stats${u.search}`);
}