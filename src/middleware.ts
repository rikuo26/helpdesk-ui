import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/assist") ||
    pathname.startsWith("/api/uploads/presign")
  ) {
    return NextResponse.next();
  }
  return NextResponse.next();
}
export const config = { matcher: ["/api/:path*"] };


