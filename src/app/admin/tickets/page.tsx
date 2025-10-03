"use client";
import AdminDashboardSafe from "@/components/admin/AdminDashboardSafe";

export default function AdminTicketsPage() {
  // 既存ページの UI/表と差し替えて良いとのことだったので、
  // 影響範囲を /admin/tickets のみとする安全なダッシュボードに入れ替え。
  return <AdminDashboardSafe />;
}