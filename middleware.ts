import { NextRequest, NextResponse } from "next/server";

/**
 * ここで /api/* を外部へプロキシしている場合でも、
 * 内部で定義している API だけは素通りさせる。
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ① 内部APIはミドルウェアを通さずそのままNextに処理させる
  if (
    pathname.startsWith("/api/assist") ||           // ← Chat 用（Next→Functions にサーバー側で中継）
    pathname.startsWith("/api/uploads/presign")     // ← 画像プリサイン（同上）
  ) {
    return NextResponse.next();
  }

  // ② それ以外に、外部Functionsへリライトしたい既存ルールがあればここに残す
  // 例）/api/tickets などを Functions に直接出す設計にしている場合
  // if (pathname.startsWith("/api/")) {
  //   const dest = new URL(req.url);
  //   dest.hostname = "func-helpdesk-k7a.azurewebsites.net";
  //   dest.pathname = `/api${pathname.replace(/^\/api/, "")}`;
  //   return NextResponse.rewrite(dest);
  // }

  return NextResponse.next();
}

// このマッチャーは必要に応じて調整（/api/* だけを対象にしておく）
export const config = {
  matcher: ["/api/:path*"],
};
