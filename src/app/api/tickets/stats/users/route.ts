import { NextResponse } from "next/server";
import { appendProxyLog, newTraceId } from "@/lib/serverLogger";
export const dynamic = "force-dynamic"; export const runtime = "nodejs";
type Ticket = { id:string; status?:string; owner?:string; createdAt?:string; updatedAt?:string; };
export async function GET(req: Request){
  const base=process.env.FUNC_BASE, key=process.env.FUNC_KEY; if(!base||!key) return new NextResponse("FUNC_BASE / FUNC_KEY missing",{status:500});
  const url=new URL(req.url, "http://localhost"); const fmt=url.searchParams.get("format")||"json"; const trace=newTraceId();
  const listUrl=new URL(`${base}/tickets`); listUrl.searchParams.set("code",key); for(const [k,v] of url.searchParams.entries()){ if(k!=="format") listUrl.searchParams.set(k,v); }
  const t0=Date.now(); const r=await fetch(listUrl.toString(), { cache:"no-store", headers:{ "x-trace-id":trace }}); const text=await r.text();
  await appendProxyLog(`[${trace}] stats/users GET -> ${listUrl} ${r.status} ${Date.now()-t0}ms body=${text.length}B`);
  if(!r.ok) return new NextResponse(text||JSON.stringify({error:`users upstream ${r.status}`}),
    { status:r.status, headers:{ "content-type":"application/json; charset=utf-8" }});
  let items:Ticket[]=[]; try{ items = text? JSON.parse(text):[] }catch{}; if(!Array.isArray(items)) items=(items as any)?.items??[];
  const rowsMap = new Map<string,{ owner:string; total:number; open:number; investigating:number; waiting:number; in_progress:number; done:number }>();
  function row(o:string){ if(!rowsMap.has(o)) rowsMap.set(o,{ owner:o,total:0,open:0,investigating:0,waiting:0,in_progress:0,done:0 }); return rowsMap.get(o)!; }
  for(const t of items){ const o=(t as any).owner||(t as any).assignedTo||(t as any).assignee||"unknown"; const s=(t.status||"unknown") as keyof Omit<ReturnType<typeof row>,"owner"|"total">; const r=row(o); r.total++; if((r as any)[s]!==undefined) (r as any)[s]++; }
  const rows=Array.from(rowsMap.values()).sort((a,b)=>b.total-a.total);
  const payload={ granularity:(url.searchParams.get("granularity")||"day"), range:Number(url.searchParams.get("days")||url.searchParams.get("months")||0), rows };
  if(fmt==="csv"){ const head=["owner","total","open","investigating","waiting","in_progress","done"]; const lines=[head.join(","), ...rows.map(r=>head.map(h=>(r as any)[h]).join(","))]; return new NextResponse(lines.join("\n"), { status:200, headers:{ "content-type":"text/csv; charset=utf-8" }}); }
  return NextResponse.json(payload, { status:200 });
}