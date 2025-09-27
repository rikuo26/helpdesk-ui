import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") { res.status(405).end(); return; }

  try {
    const base = process.env.FUNC_BASE!;
    const key  = process.env.FUNC_KEY!;
    if (!base || !key) { res.status(500).send("FUNC_BASE / FUNC_KEY missing"); return; }

    const r = await fetch(`${base}/uploads/presign?code=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await r.text();
    if (!r.ok) { res.status(r.status).send(text || "Function error"); return; }

    res.setHeader("Content-Type", "application/json");
    res.status(200).send(text);
  } catch (e:any) {
    res.status(500).send(e?.message ?? "proxy error");
  }
}
