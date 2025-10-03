export const runtime = "nodejs";

type Msg = { role: "system"|"user"|"assistant"; content: string };
const toNum = (v:any, def:number) => { const n = Number(v); return Number.isFinite(n) ? n : def; };
const rid = () => Math.random().toString(36).slice(2,10);
const b64 = (o:any) => Buffer.from(JSON.stringify(o), "utf8").toString("base64");

// ---- Health check
export async function GET() {
  const diag = {
    ok: true, service: "assist",
    version: process.env.AOAI_API_VERSION || "n/a",
    dep: process.env.AOAI_DEPLOYMENT || "n/a",
    useResponses: process.env.AOAI_USE_RESPONSES === "1"
  };
  return new Response(JSON.stringify(diag), {
    headers: { "content-type":"application/json; charset=utf-8", "x-assist-diag": b64(diag) }
  });
}

function toResponsesInput(messages: Msg[]) {
  return messages.map(m => ({ role: m.role, content: [{ type: "text", text: m.content }] }));
}
function toQuickMessages(base: Msg[]): Msg[] {
  return [
    { role: "system", content: "You are a helpful helpdesk assistant. 回答は日本語で箇条書き最大6行。結論→原因→対処の順に短く、すぐに出力する。" },
    ...base.filter(m => m.role !== "system")
  ];
}

async function call(url: string, key: string, payload: any, reqId: string, tag: string) {
  const started = Date.now();
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "api-key": key },
    body: JSON.stringify(payload)
  });
  const text = await r.text().catch(() => "");
  let json: any = {}; try { json = JSON.parse(text); } catch {}
  console.info("[assist]", JSON.stringify({ reqId, tag, url, status: r.status, ms: Date.now()-started, req: payload, res: json || text?.slice(0,500) }));
  return { ok: r.ok, status: r.status, json, text };
}
function stripParamIfIndicated(prev: {status:number,json:any,text:string}, payload:any) {
  const msg = (prev?.json?.error?.message ?? prev?.text ?? "") as string;
  const m = msg.match(/(?:Unknown|Unsupported)\s+parameter:\s*'([^']+)'/i);
  if (!m) return null;
  const k = m[1];
  if (k in payload) {
    const stripped = { ...payload }; delete stripped[k];
    return { k, stripped };
  }
  return null;
}

export async function POST(req: Request) {
  const ep  = process.env.AOAI_ENDPOINT || "";
  const dep = process.env.AOAI_DEPLOYMENT || "";
  const key = process.env.AOAI_API_KEY || "";
  const ver = process.env.AOAI_API_VERSION || "2024-12-01-preview";
  const preferResponses = (process.env.AOAI_USE_RESPONSES === "1");

  if (!ep || !dep || !key) {
    const body = { error: "aoai_not_configured", ep: !!ep, dep: !!dep, key: !!key };
    return new Response(JSON.stringify(body), { status: 500, headers: { "content-type":"application/json; charset=utf-8", "x-assist-diag": b64(body) } });
  }

  const ridVal = rid();
  const incoming: any = await req.json().catch(() => ({}));
  const question: string = incoming?.question ?? incoming?.q ?? incoming?.prompt ?? incoming?.message ?? incoming?.text ?? "";
  const messages: Msg[] = Array.isArray(incoming?.messages) && incoming.messages.length
    ? incoming.messages
    : [{ role: "system", content: "You are a helpful helpdesk assistant." }, { role: "user", content: String(question) }];

  const temperature = toNum(process.env.AOAI_TEMPERATURE ?? incoming?.temperature, 1);
  const top_p       = toNum(process.env.AOAI_TOP_P ?? incoming?.top_p, 1);
  const max_out     = Math.min(toNum(process.env.AOAI_MAX_TOKENS ?? incoming?.max_tokens, 512), 4096);

  const base = ep.replace(/\/+$/, "");

  // ---- 1) Responses（Foundry 形 → 旧形）※フラグが 1 のときだけ
  if (preferResponses) {
    // Foundry 形: POST /openai/responses （payload に model）
    const urlRespModel = `${base}/openai/responses?api-version=${ver}`;
    let payloadResp = { model: dep, input: toResponsesInput(messages), temperature, top_p, max_output_tokens: max_out };
    let res = await call(urlRespModel, key, payloadResp, ridVal, "responses");

    // 404/400 の典型は従来の deployments 形に切替
    if (!res.ok && (res.status === 404 || res.status === 400)) {
      const urlRespDep = `${base}/openai/deployments/${dep}/responses?api-version=${ver}`;
      payloadResp = { model: dep, input: toResponsesInput(messages), temperature, top_p, max_output_tokens: max_out };
      res = await call(urlRespDep, key, payloadResp, ridVal, "responses-dep");
    }

    if (res.ok) {
      const answer = res.json?.output_text ?? res.json?.output?.[0]?.content?.[0]?.text ?? "";
      if (String(answer).trim().length) {
        const ok = { reply: answer, answer, debug:{ temperature, useResponses:true } };
        return new Response(JSON.stringify(ok), { status: 200, headers: { "content-type":"application/json; charset=utf-8", "x-assist-diag": b64(ok) } });
      }
      // 空返答 → Chat へ続行
    }
  }

  // ---- 2) Chat（主経路）
  const urlChat = `${base}/openai/deployments/${dep}/chat/completions?api-version=${ver}`;
  let payloadChat: any = { messages, temperature, top_p, max_completion_tokens: max_out };

  // 1回目
  let resChat = await call(urlChat, key, payloadChat, ridVal, "chat");

  // パラメータ不一致 → 自動でキーを剥がして 1 回だけ再試行
  if (!resChat.ok && resChat.status === 400) {
    const drop = stripParamIfIndicated(resChat, payloadChat);
    if (drop) resChat = await call(urlChat, key, drop.stripped, ridVal, "chat-nostrict");
  }

  if (!resChat.ok) {
    const out = { error:"aoai_error", detail: { status:resChat.status, json:resChat.json||resChat.text } };
    return new Response(JSON.stringify(out), { status: resChat.status, headers: { "content-type":"application/json; charset=utf-8", "x-assist-diag": b64(out) } });
  }

  // 1回目の回答
  let answer = (resChat.json?.choices?.[0]?.message?.content ?? "");
  const finish = resChat.json?.choices?.[0]?.finish_reason;
  const rdet = resChat.json?.usage?.completion_tokens_details;
  const reasoningUsed = (rdet && typeof rdet.reasoning_tokens === "number") ? rdet.reasoning_tokens : 0;

  // 空 or 空白 → 短尺・即答で再試行
  if (!String(answer).trim().length) {
    const quickMax = Math.min(toNum(process.env.AOAI_MAX_TOKENS_QUICK, 256), 1024);
    const payloadQuick = { ...payloadChat, messages: toQuickMessages(messages), max_completion_tokens: quickMax };
    const quick = await call(urlChat, key, payloadQuick, ridVal, "chat-quick");
    if (quick.ok) {
      answer = quick.json?.choices?.[0]?.message?.content ?? answer;
      resChat = quick;
    }
  }

  const ok = { reply: answer ?? "", answer: answer ?? "", debug:{ temperature, useResponses:false, finish_reason: finish ?? null, reasoning_tokens: reasoningUsed } };
  return new Response(JSON.stringify(ok), { status: 200, headers: { "content-type":"application/json; charset=utf-8", "x-assist-diag": b64(ok) } });
}
