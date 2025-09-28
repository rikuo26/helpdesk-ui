export function toArray<T = unknown>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}
export function valuesToArray(v: unknown): number[] {
  if (!v || typeof v !== "object") return [];
  return Object.values(v as Record<string, unknown>).map(x => Number(x) || 0);
}
export function sum(ns: unknown): number {
  const arr = toArray<number>(ns, []);
  return arr.reduce((a,b) => a + (Number(b)||0), 0);
}
