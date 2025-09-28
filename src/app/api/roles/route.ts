import { proxyToFunc, runtime } from "../_proxy";
export { runtime };

export async function GET(req: Request) {
  return proxyToFunc(req, "/api/roles");
}
