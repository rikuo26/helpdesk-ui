"use client";
import ChatBox from "@/components/ChatBox";
import TicketForm from "@/components/TicketForm";

export default function Home() {
  return (
    <main style={{padding:16, display:"grid", gridTemplateColumns:"1fr 340px", gap:16}}>
      <section>
        <h2 style={{fontSize:18,fontWeight:600,marginBottom:8}}>問い合わせフォーム</h2>
        {/* 既存のフォームコンポーネントをそのまま使用 */}
        <TicketForm />
      </section>
      <aside>
        <h2 style={{fontSize:18,fontWeight:600,marginBottom:8}}>AI チャット</h2>
        <ChatBox />
      </aside>
    </main>
  );
}