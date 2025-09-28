"use client";
export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 24 }}>
      <h2>ページエラー</h2>
      <pre>{error?.message}</pre>
      <button onClick={() => reset()}>再試行</button>
    </div>
  );
}


