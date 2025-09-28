"use client";
import AttachmentBox from "@/components/AttachmentBox";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  return (
    <main style={{ padding: 16, display: "grid", gap: 16 }}>
      <section>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>ヘルプデスク</h1>
      </section>
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>AI チャット</h2>
        <ChatBox />
      </section>
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>添付</h2>
        <AttachmentBox />
      </section>
    </main>
  );
}