"use client";
import { useState } from "react";

export type Uploaded = {
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
};

type Props = {
  onUploaded?: (files: Uploaded[]) => void;
  accept?: string;
  maxSizeMB?: number;
};

export default function AttachmentBox({ onUploaded, accept, maxSizeMB = 10 }: Props) {
  const [files, setFiles] = useState<Uploaded[]>([]);
  const acc = accept ?? "image/jpeg,image/png,image/webp";

  function handleFiles(list: FileList | null) {
    const arr = Array.from(list ?? []);
    const ups: Uploaded[] = arr.map((f) => ({
      file: f, name: f.name, size: f.size, type: f.type,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined
    }));
    setFiles(ups);
    onUploaded?.(ups);
  }

  return (
    <div style={{display:"grid", gap:8}}>
      <input
        type="file" multiple accept={acc}
        onChange={(e)=>handleFiles(e.currentTarget.files)}
      />
      {files.length>0 && (
        <ul style={{fontSize:13, color:"#444"}}>
          {files.map((f,i)=>(
            <li key={i}>
              {f.name}（{Math.round(f.size/1024)} KB）
            </li>
          ))}
        </ul>
      )}
      <p style={{fontSize:12,color:"#666"}}>
        JPEG/PNG/WebP、最大 {maxSizeMB}MB まで。
      </p>
    </div>
  );
}