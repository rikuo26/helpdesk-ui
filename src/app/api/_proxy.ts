export async function proxyToFunc(req: Request, funcPath: string) {
  const reqUrl = new URL(req.url);
  const selfBase = (process.env.SELF_BASE || process.env.PUBLIC_BASE_URL || `${reqUrl.protocol}//${reqUrl.host}`).replace(/\/+$/,'');
  const base = (process.env.FUNC_BASE || selfBase).replace(/\/+$/,'');

  const url = `${base}${funcPath.startsWith('/') ? '' : '/'}${funcPath}`;
  const method = req.method || 'GET';

  // 入ってきたヘッダー
  const inHeaders = new Headers(req.headers);

  // 転送用ヘッダー（余計なものは落とす）
  const outHeaders = new Headers(inHeaders);
  outHeaders.delete('cookie');
  outHeaders.delete('accept-encoding'); // ← Functions 側に圧縮させない
  outHeaders.delete('content-length');

  // ホストキー（匿名でも通す）
  const hostKey = process.env.FUNC_HOST_KEY || process.env.FUNCTIONS_API_KEY;
  if (hostKey && !outHeaders.has('x-functions-key')) outHeaders.set('x-functions-key', hostKey);

  // SWA Principal を Functions に中継（ログインしていれば）
  try {
    const cookie = inHeaders.get('cookie') || '';
    if (cookie) {
      const me = await fetch(`${selfBase}/.auth/me`, { headers: { cookie }, cache: 'no-store' });
      if (me.ok) {
        const meJson = await me.json();
        const b64 = Buffer.from(JSON.stringify(meJson), 'utf8').toString('base64');
        outHeaders.set('x-ms-client-principal', b64);
      }
    }
  } catch {}

  // 相関ID（障害解析用）
  if (!outHeaders.has('x-correlation-id')) {
    try {
      // @ts-ignore
      const cid = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      outHeaders.set('x-correlation-id', cid);
    } catch {}
  }

  // ボディ
  const body = (method === 'GET' || method === 'HEAD') ? undefined
               : await req.arrayBuffer().catch(() => undefined);

  // 呼び出し
  const r = await fetch(url, { method, headers: outHeaders, body, redirect: 'manual', cache: 'no-store' });

  // レスポンスヘッダ調整（ブラウザ側エラー防止）
  const respHeaders = new Headers(r.headers);
  respHeaders.delete('content-encoding'); // ← ここが最重要
  respHeaders.delete('content-length');
  respHeaders.delete('transfer-encoding');

  return new Response(r.body, { status: r.status, headers: respHeaders });
}