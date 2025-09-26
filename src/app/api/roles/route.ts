import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** 許可テナント: 環境変数 TENANT_IDS をカンマ区切りで設定
 *  例) TENANT_IDS = 33c851a2-d97b-403c-bea3-76995f693ab6,aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
 *  環境変数が未設定の場合のフォールバックとして、既知の1つをデフォルトで許可します。
 */
const TENANTS = (process.env.TENANT_IDS
  ? process.env.TENANT_IDS.split(",").map(s => s.trim()).filter(Boolean)
  : ["33c851a2-d97b-403c-bea3-76995f693ab6"] // ←既知の1つ。必要に応じてアプリ設定で上書きしてください
).map(x => x.toLowerCase());

/** admin条件（任意）
 *  - ADMIN_GROUP_IDS: Entra グループの Object ID をカンマ区切り
 *  - ADMIN_UPNS: 管理者にしたい UPN をカンマ区切り
 *  例) ADMIN_GROUP_IDS = 11111111-2222-3333-4444-555555555555,6666...
 *      ADMIN_UPNS = you@jre-is.co.jp, admin@partner.co.jp
 */
const ADMIN_GROUP_IDS = (process.env.ADMIN_GROUP_IDS?.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)) ?? [];
const ADMIN_UPNS     = (process.env.ADMIN_UPNS?.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)) ?? [];

type Claim = { typ: string; val: string };
type Principal = {
  identityProvider?: string;
  userId?: string;
  userDetails?: string; // UPN
  userRoles?: string[];
  claims?: Claim[];     // tid, groups など
};

function decodePrincipalFromHeader(req: NextRequest): Principal | null {
  const b64 = req.headers.get("x-ms-client-principal");
  if (!b64) return null;
  try {
    const json = Buffer.from(b64, "base64").toString("utf-8");
    return JSON.parse(json) as Principal;
  } catch { return null; }
}

async function getPrincipal(req: NextRequest): Promise<Principal | null> {
  const p = decodePrincipalFromHeader(req);
  if (p) return p;
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Principal;
  } catch { /* no-op */ }
  return null;
}

function claim(principal: Principal | null, type: string): string | null {
  return principal?.claims?.find(c => c.typ === type)?.val ?? null;
}

export async function POST(req: NextRequest) {
  const principal = await getPrincipal(req);

  // 1) テナント制限
  const tid = (claim(principal, "tid") ?? "").toLowerCase();
  if (!tid || !TENANTS.includes(tid)) {
    // 許可外テナント → ロールなしで返す（＝拒否）
    return NextResponse.json({ roles: [] }, { status: 200 });
  }

  // 2) 基本ロール
  const roles = new Set<string>(["authenticated"]);

  // 3) admin付与（任意）
  const upn = principal?.userDetails?.toLowerCase() ?? "";
  const groups = principal?.claims?.filter(c => c.typ === "groups").map(c => c.val.toLowerCase()) ?? [];
  const isAdminByUpn   = !!upn && ADMIN_UPNS.includes(upn);
  const isAdminByGroup = ADMIN_GROUP_IDS.length > 0 && groups.some(g => ADMIN_GROUP_IDS.includes(g));
  if (isAdminByUpn || isAdminByGroup) roles.add("admin");

  return NextResponse.json({ roles: Array.from(roles) }, { status: 200 });
}
