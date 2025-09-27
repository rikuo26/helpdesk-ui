"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; ts: number };

const STORE_KEY = "ai-chat.thread.v2";

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900",
        ].join(" ")}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatBox() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      return raw ? (JSON.parse(raw) as Message[]) : [];
    } catch { return []; }
  });

  const listRef = useRef<HTMLDivElement>(null);

  // スクロール & 永続化
  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(thread)); } catch {}
    // 会話欄の一番下へ
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [thread]);

  const canSend = useMemo(() => !!input.trim() && !sending, [input, sending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() };
    setThread((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      // 直近 16 件 + 今回で送信
      const payload = {
        messages: [...thread.slice(-16).map(m => ({ role: m.role, content: m.content })), { role: "user", content: text }],
      };

      const r = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        throw new Error(errText || `HTTP ${r.status}`);
      }

      const data = await r.json().catch(() => ({}));
      const reply = (data?.reply ?? "").toString().trim() || "すみません、回答を生成できませんでした。";

      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: reply, ts: Date.now() };
      setThread((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `エラー: ${e?.message || "送信に失敗しました。"}`,
        ts: Date.now(),
      };
      setThread((prev) => [...prev, aiMsg]);
    } finally {
      setSending(false);
    }
  }, [input, sending, thread]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearAll = () => {
    setThread([]);
    try { sessionStorage.removeItem(STORE_KEY); } catch {}
  };

  return (
    <section className="border rounded-lg p-3 bg-white">
      {/* 見出し + 説明 */}
      <div className="mb-3">
        <div className="font-semibold">AI 相談チャット（β）</div>
        <div className="text-xs text-gray-500">
          こちらからもサポートできます。AI が回答します。例）VPNに接続できない / Outlookで添付が開けない、など。
        </div>
      </div>

      {/* 入力（上部固定） */}
      <div className="sticky top-0 bg-white z-10">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="質問を入力（Enterで送信 / Shift+Enterで改行）"
          autoComplete="off"
          rows={3}
          className="w-full border rounded-lg p-2 text-sm"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="ml-auto px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
          >
            送信
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={sending || thread.length === 0}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50"
            title="会話をクリア"
          >
            クリア
          </button>
          {sending && <span className="text-xs text-gray-500">送信中…</span>}
        </div>
      </div>

      {/* 会話（下に溜まる） */}
      <div ref={listRef} className="mt-3 h-80 sm:h-96 overflow-y-auto space-y-2 pr-1">
        {thread.length === 0 && (
          <div className="text-xs text-gray-400">
            ここに会話が表示されます。まずは上の入力欄に質問をどうぞ。
          </div>
        )}
        {thread.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
      </div>

      <div className="mt-2 text-[11px] text-gray-500">
        ※ AI の回答には誤りが含まれる場合があります。重要な内容は担当者へご確認ください。
      </div>
    </section>
  );
}