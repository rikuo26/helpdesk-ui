"use client";
export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body style={{ padding: 24 }}>
        <h1>アプリ内エラー</h1>
        <pre>{error?.message}</pre>
      </body>
    </html>
  );
}


