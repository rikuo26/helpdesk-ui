import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** 簡易メモリDB（開発サーバ再起動で消えます） */
type Ticket = {
  id: string;
  title: string;
  description: string;
  owner?: string;
  status?: "open" | "in_progress" | "done";
  createdAt?: string;
};

const db: Ticket[] = [
  { id: "t1", title: "PCのVPNが切れる", description: "在宅時に頻繁に切断される", owner: "me@example.com", status: "open", createdAt: new Date().toISOString() },
  { id: "t2", title: "プリンタドライバ更新", description: "IM C6500 の新ドライバ配布", owner: "ops@example.com", status: "in_progress", createdAt: new Date().toISOString() },
];

/** GET /api/tickets?scope=recent|mine|all */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "recent";

  let data = db;
  if (scope === "mine") {
    // 認証が無いローカル用に適当にフィルタ
    data = db.filter(t => (t.owner ?? "").startsWith("me"));
  } else if (scope === "recent") {
    data = db.slice(0, 3);
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/tickets  body: {title, description} */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.title || !body?.description) {
      return NextResponse.json({ message: "invalid" }, { status: 400 });
    }
    const t: Ticket = {
      id: "t" + (Date.now()),
      title: String(body.title),
      description: String(body.description),
      owner: "me@example.com",
      status: "open",
      createdAt: new Date().toISOString(),
    };
    db.unshift(t);
    return NextResponse.json(t, { status: 201 });
  } catch {
    return NextResponse.json({ message: "error" }, { status: 500 });
  }
}
