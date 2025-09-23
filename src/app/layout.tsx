import "./globals.css";
import Link from "next/link";
import { getClientPrincipalFromHeaders } from "@/lib/swaAuth";
import { ToastContainer } from "@/components/toast";

export const metadata = { title: "JR東日本アイステイションズ ヘルプデスク" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const p = await getClientPrincipalFromHeaders();

  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* ▼ ヘッダー：明るめAzureブルー */}
        <header className="h-12 bg-[#0078D4] text-white flex items-center justify-between px-4 shadow-sm">
          <div className="font-bold">JR東日本アイステイションズ ヘルプデスク</div>
          <div className="text-sm/none opacity-90">{p?.userDetails ?? "Guest"}</div>
        </header>
        <div className="flex">
          <aside className="w-60 border-r bg-white min-h-[calc(100vh-3rem)] p-3 space-y-2">
            <NavItem href="/" label="ダッシュボード" />
            <div className="mt-4 text-xs uppercase text-gray-500">ユーザー</div>
            <NavItem href="/my/tickets" label="マイ問い合わせ" />
            <div className="mt-4 text-xs uppercase text-gray-500">管理</div>
            <NavItem href="/admin/tickets" label="チケット管理" />
          </aside>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-xl px-3 py-2 hover:bg-[#E6F2FB]">
      {label}
    </Link>
  );
}
