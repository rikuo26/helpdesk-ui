"use client";
import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";
type Msg = { id: string; role: Role; content: string; ts?: number };

export default function AssistChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    // 自分のメッセージを即描画
    const mine: Msg = { id: crypto.randomUUID(), role: "user", content, ts: Date.now() };
    setMsgs((m) => [...m, mine]);
    setText("");
    setSending(true);

    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content }] }),
      });
      const data = await res.json().catch(() => ({}));
      const replyText = String(data?.reply ?? data?.answer ?? "すみません、応答を取得できませんでした。");
      const ai: Msg = { id: crypto.randomUUID(), role: "assistant", content: replyText, ts: Date.now() };
      setMsgs((m) => [...m, ai]);
    } catch (err: any) {
      setMsgs((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: `エラー: ${err?.message ?? "送信に失敗しました"}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* メッセージエリア（LINE風 吹き出し） */}
      <div
        ref={boxRef}
        style={{
          minHeight: 200,
          maxHeight: 340,
          overflow: "auto",
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
        }}
      >
        {msgs.length === 0 && (
          <div style={{ color: "#6b7280", fontSize: 13 }}>こちらからサポートに相談できます。</div>
        )}

        {msgs.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              margin: "8px 0",
              gap: 6,
            }}
          >
            {/* アバター（左: AI / 右: あなた） */}
            {m.role === "assistant" && <div style={avatar("assistant")}>AI</div>}

            {/* 吹き出し */}
            <div style={bubble(m.role)}>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              {m.ts && (
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.6,
                    marginTop: 4,
                    textAlign: m.role === "user" ? "right" : "left",
                  }}
                >
                  {new Date(m.ts).toLocaleTimeString()}
                </div>
              )}
            </div>

            {m.role === "user" && <div style={avatar("user")}>あなた</div>}
          </div>
        ))}
      </div>

      {/* 入力エリア */}
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="質問を入力（Enterで送信 / Shift+Enterで改行）"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
            }
          }}
          disabled={sending}
          style={{ flex: 1, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10 }}
        />
        <button
          type="submit"
          disabled={sending || text.trim() === ""}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          {sending ? "送信中…" : "送信"}
        </button>
      </form>
    </div>
  );
}

function bubble(role: Role): React.CSSProperties {
  const isUser = role === "user";
  return {
    maxWidth: "75%",
    background: isUser ? "#2563eb" : "#fff",
    color: isUser ? "#fff" : "#111827",
    border: isUser ? "1px solid #1d4ed8" : "1px solid #e5e7eb",
    padding: "10px 12px",
    borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
    boxShadow: "0 1px 2px rgba(0,0,0,.06)",
    wordBreak: "break-word",
  };
}

function avatar(role: Role): React.CSSProperties {
  const isUser = role === "user";
  return {
    alignSelf: "flex-end",
    fontSize: 11,
    color: "#fff",
    background: isUser ? "#6366f1" : "#0ea5e9",
    borderRadius: "50%",
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: isUser ? "0 0 0 6px" : "0 6px 0 0",
    flex: "0 0 28px",
  };
}