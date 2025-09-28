import { proxyToFunc, runtime } from "../_proxy";
export { runtime };

export async function POST(req: Request) {
  return proxyToFunc(req, "/api/assist");
}
