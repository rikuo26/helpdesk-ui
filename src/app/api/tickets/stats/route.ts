import { proxyToFunc, runtime } from "../../_proxy";
export { runtime };

export async function GET(req: Request) {
  const u = new URL(req.url);
  return proxyToFunc(req, "/api/tickets/stats" + (u.search || ""));
}
