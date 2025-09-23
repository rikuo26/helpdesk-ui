export type Ticket = { id: string; title: string; description: string; createdAt?: string };
export type TicketInput = { title: string; description: string };

/** 実行時BASE（無ければプロキシへ流す） */
function getBase() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return raw ? (raw.endsWith("/") ? raw.slice(0, -1) : raw) : "";
}

function buildUrl(path: string) {
  const base = getBase();
  if (base) {
    const url = new URL(path, base);
    const key = process.env.NEXT_PUBLIC_API_KEY?.trim();
    if (key) url.searchParams.set("code", key);
    return url.toString();
  }
  if (path.startsWith("/api/tickets/")) return path.replace("/api/tickets/", "/api/proxy-tickets/");
  if (path === "/api/tickets") return "/api/proxy-tickets";
  if (path === "/api/health")  return "/api/health";
  throw new Error("API base URL is not set (NEXT_PUBLIC_API_BASE_URL).");
}

export async function getTickets() {
  const r = await fetch(buildUrl("/api/tickets"), { cache: "no-store" });
  if (!r.ok) throw new Error(`tickets NG: ${r.status}`);
  return r.json() as Promise<Ticket[]>;
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const r = await fetch(buildUrl(`/api/tickets/${encodeURIComponent(id)}`), { cache: "no-store" });
  if (r.status === 404) {
    // ★ 簡易フォールバック：一覧から拾う
    try {
      const all = (await getTickets()) as Ticket[];
      return all.find(x => x.id === id) ?? null;
    } catch {
      return null;
    }
  }
  if (!r.ok) throw new Error(`ticket NG: ${r.status}`);
  return r.json();
}

export async function createTicket(input: TicketInput): Promise<{ id: string }> {
  const r = await fetch(buildUrl("/api/tickets"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`create NG: ${r.status} ${text}`);
  }
  return r.json();
}

// 使っている他の関数（health など）があればこの下に置く
