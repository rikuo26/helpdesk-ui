import TicketForm from "@/components/TicketForm";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  return (
    <main style={{ padding:16, display:"grid", gridTemplateColumns:"1fr 360px", gap:16 }}>
      <section>
        <h2 style={{ fontSize:18, fontWeight:600, marginBottom:12 }}>問い合わせフォーム</h2>
        <TicketForm />
      </section>
      <aside>
        <h2 style={{ fontSize:18, fontWeight:600, marginBottom:12 }}>AI 相談チャット（β）</h2>
        <ChatBox />
      </aside>
    </main>
  );
}