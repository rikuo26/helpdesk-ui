"use client";
export default function Error(
  { error, reset }: { error: Error & { digest?: string }; reset: () => void }
) {
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "#b91c1c" }}>ページエラー</h1>
      <p style={{ marginTop: 8 }}>詳細はブラウザの Console/Network で確認できます。</p>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 12, color: "#444" }}>
        {String(error?.message || "unknown")}
      </pre>
      <button onClick={() => reset()} style={{ marginTop: 12 }}>再試行</button>
    </main>
  );
}