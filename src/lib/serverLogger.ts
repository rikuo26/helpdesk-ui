import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const LOG_DIR = path.join(process.cwd(), ".logs");

export function newTraceId(): string {
  return randomUUID().slice(0, 8);
}
async function ensureFile(): Promise<string> {
  await fs.mkdir(LOG_DIR, { recursive: true });
  return path.join(LOG_DIR, `proxy-${new Date().toISOString().slice(0,10)}.log`);
}
export async function appendProxyLog(line: string): Promise<void> {
  const file = await ensureFile();
  await fs.appendFile(file, line + "\n", "utf8");
}
export async function readProxyLogTail(lines = 200): Promise<string> {
  await fs.mkdir(LOG_DIR, { recursive: true });
  const files = (await fs.readdir(LOG_DIR)).filter(f => f.startsWith("proxy-")).sort();
  if (!files.length) return "(no logs yet)";
  const latest = path.join(LOG_DIR, files[files.length - 1]);
  const text = await fs.readFile(latest, "utf8").catch(() => "");
  const arr = text.split(/\r?\n/).filter(Boolean);
  const n = Math.min(Math.max(lines, 1), 5000);
  return arr.slice(-n).join("\n");
}
