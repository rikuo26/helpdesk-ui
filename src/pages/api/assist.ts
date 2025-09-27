import type { NextApiRequest, NextApiResponse } from "next";

function getCfg() {
  const base = process.env.API_BASE  || process.env.FUNC_BASE;
  const key  = process.env.API_KEY   || process.env.FUNC_KEY;
  if (!base || !key) {
    return { ok: false as const, msg: "FUNC_BASE / FUNC_KEY (or API_BASE / API_KEY) missing" };
  }
  return { ok: true as const, base: base.replace(/\/$/, ""), key };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cfg = getCfg();
  if (!cfg.ok) {
    res.status(500).json({ error: cfg.msg });
    return;
  }
  const target = `${cfg.base}/assist?code=${encodeURIComponent(cfg.key)}${
    req.method === "GET" && req.query.debug === "1" ? "&debug=1" : ""
  }`;

  // Body を素通し
  const init: RequestInit = {
    method: req.method,
    headers: { "content-type": "application/json", "x-functions-key": cfg.key },
  };
  if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
    init.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  try {
    const r = await fetch(target, init);
    const text = await r.text();
    res.status(r.status);
    res.setHeader("content-type", r.headers.get("content-type") || "application/json; charset=utf-8");
    res.send(text);
  } catch (e:any) {
    res.status(502).json({ error: "assist proxy failed", message: e?.message || String(e) });
  }
}