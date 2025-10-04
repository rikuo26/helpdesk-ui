"use client";
import InquiryForm from "@/components/InquiryForm";
import AssistChatBubbles from "@/components/assist/AssistChatBubbles";

export default function Page(){
  return (
    <div style={{display:"grid", gap:16}}>
      <InquiryForm />
      <div style={{borderTop:"1px solid #e5e7eb"}} />
      <AssistChatBubbles />
    </div>
  );
}