"use client";
import { useState } from "react";

type Props = { onFiles?: (files: File[]) => void };

export default function AttachmentBox({ onFiles }: Props) {
  const [files, setFiles] = useState<File[]>([]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files || []);
    setFiles(fs);
    onFiles?.(fs);
  }

  return (
    <div style={{display:"grid", gap:8}}>
      <input type="file" multiple onChange={onChange} />
      {files.length > 0 && (
        <ul>
          {files.map((f, i) => (
            <li key={i}>{f.name} ({Math.round(f.size/1024)} KB)</li>
          ))}
        </ul>
      )}
    </div>
  );
}