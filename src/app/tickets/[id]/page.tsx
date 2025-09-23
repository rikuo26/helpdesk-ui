// Server Component
import React from "react";
import EditorClient from "./EditorClient";

export const dynamic = "force-dynamic"; // devでキャッシュ無効

export default async function TicketDetailPage({
  params,
}: {
  // Next15: params は Promise を await する
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await fetch(`${base}/api/tickets/${id}`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <a href="/tickets">← Back to list</a>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 16px" }}>
          Ticket Detail
        </h1>
        <p style={{ color: "crimson" }}>
          Failed to load: {res.status} {res.statusText}
        </p>
      </main>
    );
  }

  const data = (await res.json()) as {
    id: string;
    title: string;
    description: string;
    createdAt?: string;
  };

  return <EditorClient id={id} initial={data} />;
}
