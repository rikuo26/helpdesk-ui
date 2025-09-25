"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TicketCheck, Shield } from "lucide-react";

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-60 border-r bg-white min-h-[calc(100vh-3rem)] p-3 space-y-3">
      <NavItem href="/" label="ダッシュボード" icon={<LayoutDashboard size={18} />} active={path === "/"} />
      <div className="mt-2 text-xs uppercase text-gray-500">ユーザー</div>
      <NavItem href="/my/tickets" label="マイ問い合わせ" icon={<TicketCheck size={18} />} active={path.startsWith("/my")} />
      <div className="mt-2 text-xs uppercase text-gray-500">管理</div>
      <NavItem href="/admin/tickets" label="チケット管理" icon={<Shield size={18} />} active={path.startsWith("/admin")} />
    </aside>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-2 rounded-xl px-3 py-2 transition",
        active ? "bg-[#106EBE] text-white shadow-sm" : "hover:bg-[#E6F2FB] text-gray-900"
      ].join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
