"use client";
import { useParams } from "next/navigation";
import TicketEditForm from "@/components/admin/TicketEditForm";
export default function AdminTicketEditPage(){
  const params = useParams<{id:string}>(); const id = String(params?.id ?? "");
  if (!id) return <div style={{padding:16, color:"#b91c1c"}}>ID が不正です。</div>;
  return <TicketEditForm id={id}/>;
}