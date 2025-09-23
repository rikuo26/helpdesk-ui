import React from "react";
import EditorClient from "./EditorClient";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await apiGet(`/api/tickets/${id}`);
  return <EditorClient id={id} initial={data} />;
}
