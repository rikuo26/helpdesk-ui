"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/lib/api";

export default function Page() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("タイトルと内容は必須です。");
      return;
    }

    try {
      const { id } = await createTicket({ title: title.trim(), description: description.trim() });
      // 作成成功 or フォールバックIDでも詳細へ遷移
      startTransition(() => router.push(`/tickets/${id}`));
    } catch (err: any) {
      setError(err?.message ?? "作成に失敗しました。");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 640 }}>
      <h1>新規チケット作成</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          タイトル
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            placeholder="例）PCが起動しない"
          />
        </label>
        <label>
          内容
          <textarea
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, minHeight: 120 }}
            placeholder="症状、発生タイミング、エラーメッセージなど"
          />
        </label>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          style={{ padding: "10px 16px", fontWeight: 600, borderRadius: 8 }}
        >
          {isPending ? "送信中..." : "作成する"}
        </button>
      </form>
      <p style={{ opacity: 0.6, marginTop: 8 }}>
        ※ 現在API未実装のため、一時的にローカルIDで詳細画面へ遷移する場合があります。
      </p>
    </main>
  );
}
