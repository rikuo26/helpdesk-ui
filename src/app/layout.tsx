import "./globals.css";
import { getClientPrincipalFromHeaders } from "@/lib/swaAuth";
import Sidebar from "@/components/Sidebar";

export const metadata = { title: "JR東日本アイステイションズ ヘルプデスク" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const p = await getClientPrincipalFromHeaders();

  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* ヘッダー：明るく鮮やかなAzureブルー */}
        <header className="h-12 bg-[#0078D4] text-white flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <div className="w-6 h-6 rounded-sm bg-white/90 text-[#0078D4] grid place-items-center text-xs font-extrabold">JIS</div>
            <div>JR東日本アイステイションズ ヘルプデスク</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm/none opacity-90 truncate max-w-[240px]">{p?.userDetails ?? "Guest"}</span>
            <div className="w-7 h-7 rounded-full bg-white/90 text-[#0078D4] grid place-items-center text-xs font-bold">
              {(p?.userDetails ?? "G").slice(0,1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}


