import { proxyToFunc, runtime } from "../_proxy";
export { runtime };

export async function GET(req: Request) {
  const u = new URL(req.url);
  // 例: /api/tickets?scope=mine → /api/tickets?scope=mine
  return proxyToFunc(req, "/api/tickets" + (u.search || ""));
}

export async function POST(req: Request) {
  return proxyToFunc(req, "/api/tickets");
}
