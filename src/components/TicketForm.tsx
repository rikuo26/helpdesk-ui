"use client";
import { useState } from "react";
import { toast } from "@/components/toast";

export default function TicketForm() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc }),
    });
    if (res.ok) {
      toast.success("作成しました");
      setTitle(""); setDesc("");
    } else {
      toast.error("作成に失敗しました");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">タイトル</label>
        <input className="w-full rounded-lg border px-3 py-2"
               value={title} onChange={e=>setTitle(e.target.value)}
               required maxLength={80} />
      </div>
      <div>
        <label className="block text-sm mb-1">内容</label>
        <textarea className="w-full rounded-lg border px-3 py-2"
                  value={desc} onChange={e=>setDesc(e.target.value)}
                  required maxLength={2000} rows={6} />
      </div>
      <button className="px-4 py-2 rounded-xl bg-black text-white">送信</button>
    </form>
  );
}


