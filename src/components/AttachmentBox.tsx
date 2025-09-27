"use client";
import React, { useCallback, useRef, useState } from "react";

export type Uploaded = {
  url: string;
  blobName: string;
  contentType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

type Draft = {
  id: string;
  file: File;
  preview: string;
  status: "queued" | "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
  uploaded?: Uploaded;
  width?: number;
  height?: number;
};

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MODE = process.env.NEXT_PUBLIC_ATTACHMENTS_MODE ?? "real"; // "mock" | "real"

async function getImageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = URL.createObjectURL(file);
  });
}

export default function AttachmentBox({ onChanged }: { onChanged: (files: Uploaded[]) => void }) {
  const [items, setItems] = useState<Draft[]>([]);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const picked = Array.from(files || []);
    if (!picked.length) return;

    const toAdd: Draft[] = picked.slice(0, Math.max(0, MAX_FILES - items.length)).map((f) => {
      const badType = !ACCEPT.includes(f.type);
      const badSize = f.size > MAX_BYTES;
      return {
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        status: badType || badSize ? "error" : "queued",
        progress: 0,
        error: badType ? "JPEG/PNG/WebP のみ対応" : badSize ? "サイズ上限は 10MB です" : undefined,
      };
    });

    setItems((prev) => [...prev, ...toAdd]);

    // 画像寸法だけ非同期で取得
    for (const it of toAdd) {
      if (it.status === "queued") {
        try {
          const { width, height } = await getImageSize(it.file);
          setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, width, height } : p)));
        } catch { /* noop */ }
      }
    }
  }, [items.length]);

  const removeOne = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    onChanged(next.filter((x) => x.uploaded).map((x) => x.uploaded!));
  };

  const clearAll = () => {
    setItems([]);
    onChanged([]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHovered(false);
    addFiles(e.dataTransfer.files);
  };

  async function uploadOne(d: Draft): Promise<Draft> {
    if (d.status !== "queued") return d;

    // MOCK: 即時で完了
    if (MODE === "mock") {
      const uploaded: Uploaded = {
        url: d.preview,
        blobName: `mock/${crypto.randomUUID()}`,
        contentType: d.file.type,
        sizeBytes: d.file.size,
        width: d.width,
        height: d.height,
      };
      const next: Draft = { ...d, status: "uploaded", progress: 100, uploaded };
      const listed = items.map((x) => (x.id === d.id ? next : x));
      setItems(listed);
      onChanged(listed.filter((x) => x.uploaded).map((x) => x.uploaded!));
      return next;
    }

    // REAL: /api/uploads/presign → SAS PUT
    try {
      setItems((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: "uploading", progress: 5 } : x)));

      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: d.file.name, contentType: d.file.type }),
      });
      if (!presign.ok) throw new Error("SAS 取得に失敗しました");
      const { putUrl, publicUrl, blobName } = await presign.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", putUrl);
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.setRequestHeader("Content-Type", d.file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.max(10, Math.round((e.loaded / e.total) * 100));
            setItems((prev) => prev.map((x) => (x.id === d.id ? { ...x, progress: pct } : x)));
          }
        };
        xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`PUT 失敗 (${xhr.status})`)));
        xhr.onerror = () => reject(new Error("アップロードに失敗しました"));
        xhr.send(d.file);
      });

      const uploaded: Uploaded = {
        url: publicUrl,
        blobName,
        contentType: d.file.type,
        sizeBytes: d.file.size,
        width: d.width,
        height: d.height,
      };
      const next: Draft = { ...d, status: "uploaded", progress: 100, uploaded };
      const listed = items.map((x) => (x.id === d.id ? next : x));
      setItems(listed);
      onChanged(listed.filter((x) => x.uploaded).map((x) => x.uploaded!));
      return next;
    } catch (e: any) {
      const next: Draft = { ...d, status: "error", error: e?.message || "アップロード失敗" };
      setItems((prev) => prev.map((x) => (x.id === d.id ? next : x)));
      return next;
    }
  }

  const uploadAll = async () => {
    for (const d of items) if (d.status === "queued") await uploadOne(d);
  };

  const uploadedCount = items.filter((i) => i.status === "uploaded").length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm">
          <span className="font-medium">添付（{uploadedCount}/{items.length} 完了）</span>
          <span className="text-gray-500 ml-2">JPEG/PNG/WebP、最大 10MB・{MAX_FILES} ファイル</span>
        </div>
        <div className="flex items-center gap-2">
          {items.some((x) => x.status === "queued") && MODE !== "mock" && (
            <button type="button" onClick={uploadAll} className="text-xs px-3 py-1 rounded border hover:bg-gray-50">
              すべてアップロード
            </button>
          )}
          {!!items.length && (
            <button type="button" onClick={clearAll} className="text-xs px-3 py-1 rounded border hover:bg-gray-50">
              すべて削除
            </button>
          )}
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-sm text-gray-600 transition ${hovered ? "bg-blue-50 border-blue-300" : "border-gray-300"}`}
        onDragOver={(e) => { e.preventDefault(); setHovered(true); }}
        onDragLeave={() => setHovered(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        ここにドラッグ＆ドロップ、またはクリックして選択
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {!!items.length && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {items.map((it) => (
            <div key={it.id} className="relative border rounded-md p-2 bg-white">
              <img src={it.preview} alt="" className="w-full h-28 object-cover rounded" />
              <div className="text-xs mt-1 truncate">{it.file.name}</div>
              {it.width && it.height && (
                <div className="text-[11px] text-gray-500">{it.width}×{it.height}px</div>
              )}
              {it.status !== "uploaded" && (
                <div className="h-2 bg-gray-200 rounded mt-1">
                  <div className="h-2 rounded" style={{ width: `${it.progress}%`, background: "#1f7ae0" }} />
                </div>
              )}
              {it.status === "error" && <div className="text-red-600 text-xs mt-1">{it.error}</div>}
              <button type="button" className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded px-2" onClick={() => removeOne(it.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}