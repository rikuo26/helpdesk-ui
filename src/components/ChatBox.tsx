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

  // 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ & 豌ｸ邯壼喧
  useEffect(() => {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(thread)); } catch {}
    // 莨夊ｩｱ谺・・荳逡ｪ荳九∈
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
      // 逶ｴ霑・16 莉ｶ + 莉雁屓縺ｧ騾∽ｿ｡
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
      const reply = (data?.reply ?? "").toString().trim() || "縺吶∩縺ｾ縺帙ｓ縲∝屓遲斐ｒ逕滓・縺ｧ縺阪∪縺帙ｓ縺ｧ縺励◆縲・;

      const aiMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: reply, ts: Date.now() };
      setThread((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `繧ｨ繝ｩ繝ｼ: ${e?.message || "騾∽ｿ｡縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・}`,
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
      {/* 隕句・縺・+ 隱ｬ譏・*/}
      <div className="mb-3">
        <div className="font-semibold">AI 逶ｸ隲・メ繝｣繝・ヨ・夷ｲ・・/div>
        <div className="text-xs text-gray-500">
          縺薙■繧峨°繧峨ｂ繧ｵ繝昴・繝医〒縺阪∪縺吶・I 縺悟屓遲斐＠縺ｾ縺吶ゆｾ具ｼ鰻PN縺ｫ謗･邯壹〒縺阪↑縺・/ Outlook縺ｧ豺ｻ莉倥′髢九￠縺ｪ縺・√↑縺ｩ縲・        </div>
      </div>

      {/* 蜈･蜉幢ｼ井ｸ企Κ蝗ｺ螳夲ｼ・*/}
      <div className="sticky top-0 bg-white z-10">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="雉ｪ蝠上ｒ蜈･蜉幢ｼ・nter縺ｧ騾∽ｿ｡ / Shift+Enter縺ｧ謾ｹ陦鯉ｼ・
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
            騾∽ｿ｡
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={sending || thread.length === 0}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50"
            title="莨夊ｩｱ繧偵け繝ｪ繧｢"
          >
            繧ｯ繝ｪ繧｢
          </button>
          {sending && <span className="text-xs text-gray-500">騾∽ｿ｡荳ｭ窶ｦ</span>}
        </div>
      </div>

      {/* 莨夊ｩｱ・井ｸ九↓貅懊∪繧具ｼ・*/}
      <div ref={listRef} className="mt-3 h-80 sm:h-96 overflow-y-auto space-y-2 pr-1">
        {thread.length === 0 && (
          <div className="text-xs text-gray-400">
            縺薙％縺ｫ莨夊ｩｱ縺瑚｡ｨ遉ｺ縺輔ｌ縺ｾ縺吶ゅ∪縺壹・荳翫・蜈･蜉帶ｬ・↓雉ｪ蝠上ｒ縺ｩ縺・◇縲・          </div>
        )}
        {thread.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
      </div>

      <div className="mt-2 text-[11px] text-gray-500">
        窶ｻ AI 縺ｮ蝗樒ｭ斐↓縺ｯ隱､繧翫′蜷ｫ縺ｾ繧後ｋ蝣ｴ蜷医′縺ゅｊ縺ｾ縺吶る㍾隕√↑蜀・ｮｹ縺ｯ諡・ｽ楢・∈縺皮｢ｺ隱阪￥縺縺輔＞縲・      </div>
    </section>
  );
}
