import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "ticket-overrides.json");

export type TicketOverride = { status?: string; updatedAt?: string; updatedBy?: string };
type Map = Record<string, TicketOverride>;

async function readFileJson(): Promise<Map> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return {}; }
}
async function writeFileJson(m: Map) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(m, null, 2), "utf8");
}

export async function readOverrides(): Promise<Map> { return readFileJson(); }
export async function upsertOverride(id: string, patch: TicketOverride) {
  const m = await readFileJson(); m[id] = { ...(m[id]||{}), ...patch }; await writeFileJson(m); return m[id];
}
export async function removeOverride(id: string) { const m = await readFileJson(); delete m[id]; await writeFileJson(m); }

export function applyOverrideToItem<T extends Record<string, any>>(item: T, ov?: TicketOverride): T {
  if (!item || !ov) return item;
  const next: any = { ...item };
  if (ov.status !== undefined) next.status = ov.status;
  if (ov.updatedAt) next.updatedAt = ov.updatedAt;
  if (ov.updatedBy) next.updatedBy = ov.updatedBy;
  return next;
}
export function applyOverridesToList<T extends { id: string }>(list: T[], map: Map): T[] {
  return (list || []).map(it => applyOverrideToItem(it, map[it.id]));
}

