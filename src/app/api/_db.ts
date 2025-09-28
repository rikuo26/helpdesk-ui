export type Ticket = {
  id: string;
  title: string;
  description: string;
  owner?: string;
  status?: "open" | "investigating" | "waiting" | "in_progress" | "done";
  createdAt?: string;
};

// 単純なメモリDB（開発サーバ再起動で消えます）
const _db: Ticket[] = [
  { id: "t1", title: "PCのVPNが切れる", description: "在宅時に頻繁に切断される", owner: "me@example.com", status: "open", createdAt: new Date().toISOString() },
  { id: "t2", title: "プリンタドライバ更新", description: "IM C6500 の新ドライバ配布", owner: "ops@example.com", status: "in_progress", createdAt: new Date().toISOString() },
];

export function list(scope?: string) {
  if (scope === "mine") return _db.filter(t => (t.owner ?? "").startsWith("me"));
  if (scope === "recent") return _db.slice(0, 3);
  return _db;
}

export function create(input: { title: string; description: string }) {
  const t: Ticket = {
    id: "t" + Date.now(),
    title: String(input.title),
    description: String(input.description),
    owner: "me@example.com",
    status: "open",
    createdAt: new Date().toISOString(),
  };
  _db.unshift(t);
  return t;
}

export function updateStatus(id: string, status: Ticket["status"]) {
  const i = _db.findIndex(x => x.id === id);
  if (i === -1) return null;
  _db[i] = { ..._db[i], status };
  return _db[i];
}

