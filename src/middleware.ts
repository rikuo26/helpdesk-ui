import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return NextResponse.next();   // ← API は触らない
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
