import { headers } from "next/headers";

export type ClientPrincipal = {
  userId?: string;
  userDetails?: string;
  identityProvider?: string;
  userRoles: string[];
};

/** Next.js 15: headers() は await が必須 */
export async function getClientPrincipalFromHeaders(): Promise<ClientPrincipal | null> {
  const h = await headers();
  const header = h.get("x-ms-client-principal");
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    const obj = JSON.parse(decoded);
    return {
      userId: obj.userId,
      userDetails: obj.userDetails,
      identityProvider: obj.identityProvider,
      userRoles: obj.userRoles || []
    } as ClientPrincipal;
  } catch {
    return null;
  }
}

export const isAuthenticated = (p?: ClientPrincipal | null) =>
  !!p && p.userRoles?.includes("authenticated");

export const isAdmin = (p?: ClientPrincipal | null) =>
  !!p && p.userRoles?.includes("admin");
