"use client";
import React, { useMemo, useState } from "react";
import AttachmentBox, { Uploaded } from "@/components/AttachmentBox";
import ChatBox from "@/components/ChatBox";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function InquiryFormPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Uploaded[]>([]);
  const [posting, setPosting] = useState(false);

  const titleErr = title.trim().length === 0 ? "必須です" : "";
  const bodyErr =
    body.trim().length < 10 ? "10文字以上で具体的にご記入ください" : "";
  const canSubmit =
    title.trim().length > 0 && body.trim().length >= 10 && !posting;

  const bodyCount = useMemo(() => body.trim().length, [body]);

  const submit = async () => {
    if (!canSubmit) return;
    setPosting(true);
    try {
      const url = API_BASE
        ? `${API_BASE.replace(/\/$/, "")}/api/tickets`
        : "/api/tickets";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: body,
          attachments: attachments.map((a) => ({
            url: a.url,
            blobName: a.blobName,
            contentType: a.contentType,
            sizeBytes: a.sizeBytes,
            width: a.width,
            height: a.height,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setTitle("");
      setBody("");
      setAttachments([]);
      alert("送信しました。");
    } catch (e: any) {
      alert(e?.message ?? "送信に失敗しました");
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">問い合わせフォーム</h1>
        <p className="text-sm text-gray-600 mt-1">
          不具合・要望・質問をこちらから送信できます。画像の添付も可能です。
        </p>
      </header>

      {/* 2カラム（右にチャット） */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左：フォーム（2カラム分） */}
        <section className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            {/* 件名 */}
            <label className="block mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">件名</span>
                <span className="text-red-600 text-xs">必須</span>
              </div>
              <input
                className={`mt-1 w-full border rounded-lg px-3 py-2 ${
                  titleErr ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="例）アプリの画面が真っ白になる"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {titleErr && (
                <div className="text-xs text-red-600 mt-1">{titleErr}</div>
              )}
            </label>

            {/* 内容 */}
            <label className="block mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">内容</span>
                  <span className="text-red-600 text-xs">必須</span>
                </div>
                <span
                  className={`text-xs ${
                    bodyCount < 10 ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {bodyCount} / 2000
                </span>
              </div>
              <textarea
                className={`mt-1 w-full border rounded-lg px-3 py-2 min-h-[160px] ${
                  bodyErr ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="再現手順、発生頻度、期待する動作、影響範囲などをできるだけ具体的にご記入ください。"
                value={body}
                maxLength={2000}
                onChange={(e) => setBody(e.target.value)}
              />
              {bodyErr && (
                <div className="text-xs text-red-600 mt-1">{bodyErr}</div>
              )}
            </label>

            {/* 添付 */}
            <div className="mb-4">
              <AttachmentBox onChanged={setAttachments} />
            </div>

            {/* 送信 */}
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: "#1f7ae0" }}
                disabled={!canSubmit}
                onClick={submit}
              >
                {posting ? "送信中…" : "送信"}
              </button>
              <span className="text-xs text-gray-500">
                送信後に担当から連絡します。緊急の場合は社内チャットでご連絡ください。
              </span>
            </div>
          </div>
        </section>

        {/* 右：Azure OpenAI チャット */}
        <aside className="lg:col-span-1">
          <ChatBox />
        </aside>
      </div>
    </main>
  );
}
