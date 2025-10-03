"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active =
    href === "/"
      ? pathname === "/"                // ルートは完全一致
      : pathname.startsWith(href);      // それ以外は前方一致
  return (
    <Link
      href={href}
      className={
        "block rounded-md px-3 py-2 text-sm " +
        (active
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-gray-700 hover:bg-gray-50")
      }
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[220px] border-r border-gray-200 bg-white">
      <div className="p-4 text-xs tracking-wide text-gray-400">メニュー</div>
      <nav className="px-3 space-y-1">
        <NavItem href="/" label="問い合わせフォーム" />
        <NavItem href="/mypage" label="マイページ" />
        <div className="text-xs tracking-wide text-gray-400 mt-4 mb-2">運用</div>
        <NavItem href="/admin/tickets/manage" label="チケット管理" />
      </nav>
    </aside>
  );
}