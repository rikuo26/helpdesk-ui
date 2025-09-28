"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const BRAND = "#1f7ae0"; // ヘッダーと同じ青色に合わせる

const Item: React.FC<{ href: string; label: string }> = ({ href, label }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block px-4 py-2 rounded-md mb-1 transition-colors ${
        active
          ? "text-white"
          : "text-gray-700 hover:bg-gray-100"
      }`}
      style={active ? { background: BRAND } : {}}
    >
      {label}
    </Link>
  );
};

export default function Sidebar() {
  return (
    <aside className="w-60 p-3 min-h-screen border-r bg-white">
      <div className="text-xs tracking-wide text-gray-500 mb-2">メニュー</div>
      <nav>
        <Item href="/" label="問い合わせフォーム" />
        <Item href="/mypage" label="マイページ" />
        <div className="text-xs tracking-wide text-gray-400 mt-4 mb-2">運用</div>
        <Item href="/admin/tickets" label="チケット管理" />
      </nav>
    </aside>
  );
}

