'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

type PostResult = {
  ok: boolean;
  id?: number;
};

export default function CreateTicketPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setMsg('');
  try {
    const res = await apiPost<PostResult>('api/tickets', { title, body }); // ← ここ！
    if (res.ok) {
      setTitle('');
      setBody('');
      setMsg(`作成しました（ID: ${res.id ?? '?'})`);
    } else {
      setMsg('作成に失敗しました');
    }
  } catch (e: any) {
    setMsg(e?.message ?? 'エラーが発生しました');
  }
}


  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>問い合わせ作成</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
        <label>
          タイトル
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </label>
        <label>
          本文
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            required
            style={{ width: '100%' }}
          />
        </label>
        <button type="submit">送信</button>
        {msg && <p style={{ color: 'crimson' }}>HTTP  {msg}</p>}
      </form>

      <div style={{ marginTop: '2rem' }}>
        <Link href="/tickets">問い合わせ一覧を見る</Link>
        <br />
        <Link href="/admin/tickets">（担当者）チケット一覧</Link>
      </div>
    </main>
  );
}
