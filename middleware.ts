import { NextRequest, NextResponse } from "next/server";

function parsePrincipal(req: NextRequest) {
  const header = req.headers.get("x-ms-client-principal");
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const principal = parsePrincipal(req);
  const roles: string[] = principal?.userRoles || [];
  const isAuthed = roles.includes("authenticated");
  const isAdmin = roles.includes("admin");

  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      return NextResponse.redirect(
        new URL("/.auth/login/aad?post_login_redirect_uri=" + encodeURIComponent(pathname), req.url)
      );
    }
    if (!isAdmin) {
      return NextResponse.rewrite(new URL("/403", req.url));
    }
  }

  if (pathname.startsWith("/my")) {
    if (!isAuthed) {
      return NextResponse.redirect(
        new URL("/.auth/login/aad?post_login_redirect_uri=" + encodeURIComponent(pathname), req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/my/:path*"],
};
