"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export default function InquiryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const titleLen = title.trim().length;
  const descLen = description.trim().length;
  const invalid = titleLen < 1 || descLen < 10;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    setBusy(true);
    try {
      await apiPost("/tickets", { title, description });
      // 送信後は一覧へ
      router.push("/mypage?scope=all");
      router.refresh();
      setTitle(""); setDescription(""); setFiles([]);
    } catch (err) {
      console.error(err);
      alert("送信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (busy) return;
    const fs = Array.from(e.dataTransfer.files || []);
    setFiles(prev => [...prev, ...fs].slice(0, 5));
  }
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...fs].slice(0, 5));
  }

  return (
    <form onSubmit={onSubmit} className="inq" noValidate>
      <div className="row">
        <label htmlFor="title">件名 <span className="req">必須</span></label>
        <input id="title"
          value={title} onChange={(e)=>setTitle(e.target.value)}
          placeholder="例）アプリの画面が真っ白"
          maxLength={80} autoFocus disabled={busy} autoComplete="off" />
        <div className="counter">{titleLen}/80</div>
      </div>

      <div className="row">
        <label htmlFor="desc">内容 <span className="req">必須</span></label>
        <textarea id="desc"
          value={description} onChange={(e)=>setDescription(e.target.value)}
          placeholder="再現手順、発生頻度、期待する動作、影響範囲 など具体的にご記入ください。"
          rows={7} maxLength={1000} disabled={busy} />
        <div className="hint">※ 10文字以上でご記入ください</div>
        <div className="counter">{descLen}/1000</div>
      </div>

      <div className="row">
        <label>添付（任意）</label>
        <div className="drop" onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
          <input type="file" multiple onChange={onPick} style={{display:"none"}} id="pick" />
          <label htmlFor="pick" className="pick">ここにドラッグ＆ドロップ / ファイル選択</label>
          <div className="hint">最大 10MB, JPEG/PNG/WebP（※アップロード処理は後日実装）</div>
          {files.length>0 &&
            <ul className="files">
              {files.map((f,i)=>(<li key={i}>{f.name}</li>))}
            </ul>
          }
        </div>
      </div>

      <div className="actions">
        <button type="submit" disabled={busy || invalid}>
          {busy ? "送信中..." : "送信"}
        </button>
      </div>

      <style jsx>{`
        .inq { display:grid; gap:16px; }
        .row { display:grid; gap:8px; position:relative; }
        label { font-weight:600; }
        .req { color:#ef4444; font-weight:600; margin-left:6px; }
        input, textarea {
          width:100%; font-size:14px; border:1px solid #e5e7eb; border-radius:10px;
          padding:10px 12px; outline:none; background:#fff;
        }
        textarea { resize:vertical; min-height:140px; }
        input:focus, textarea:focus {
          border-color:#3b82f6; box-shadow:0 0 0 4px rgba(59,130,246,.15);
        }
        input:disabled, textarea:disabled { background:#f9fafb; color:#6b7280; }
        .counter { position:absolute; right:8px; bottom:-18px; font-size:11px; color:#6b7280; }
        .hint { font-size:12px; color:#6b7280; }
        .drop { border:1px dashed #cbd5e1; border-radius:10px; padding:12px; background:#fafafa; }
        .pick { display:inline-block; padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; cursor:pointer; background:#fff; margin-bottom:6px; }
        .files { margin:6px 0 0 0; padding-left:16px; font-size:13px; color:#374151; }
        .actions { display:flex; justify-content:flex-end; }
        button {
          background:#111827; color:white; padding:10px 16px; border-radius:10px; border:none; cursor:pointer;
          transition: transform .03s ease, opacity .2s;
        }
        button:hover { transform: translateY(-1px); }
        button:disabled { opacity:.5; cursor:not-allowed; transform:none; }
      `}</style>
    </form>
  );
}
