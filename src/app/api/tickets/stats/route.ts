import { NextResponse } from "next/server";
import { appendProxyLog, newTraceId } from "@/lib/serverLogger";
export const dynamic = "force-dynamic"; export const runtime = "nodejs";
type Ticket = { id:string; createdAt?:string; updatedAt?:string; status?:string; owner?:string; };
function envCheck(){ const base=process.env.FUNC_BASE, key=process.env.FUNC_KEY; if(!base||!key) return new Response("FUNC_BASE / FUNC_KEY missing",{status:500}); return null; }
export async function GET(req: Request){
  const err=envCheck(); if(err) return err;
  const base=process.env.FUNC_BASE!, key=process.env.FUNC_KEY!;
  const url=new URL(req.url, "http://localhost");
  const gran = (url.searchParams.get("granularity")||"day") as "day"|"month";
  const days = Number(url.searchParams.get("days")||"14");
  const months= Number(url.searchParams.get("months")||"6");
  const trace=newTraceId();
  // upstream list
  const listUrl=new URL(`${base}/tickets`); listUrl.searchParams.set("code", key);
  for(const [k,v] of url.searchParams.entries()){ if(!["granularity","days","months"].includes(k)) listUrl.searchParams.set(k,v); }
  const t0=Date.now(); const r=await fetch(listUrl.toString(), { cache:"no-store", headers:{ "x-trace-id":trace }});
  const text=await r.text(); await appendProxyLog(`[${trace}] stats GET -> ${listUrl} ${r.status} ${Date.now()-t0}ms body=${text.length}B`);
  if(!r.ok) return new NextResponse(text||JSON.stringify({error:`stats upstream ${r.status}`}),
    { status:r.status, headers:{ "content-type":"application/json; charset=utf-8" }});
  let items:Ticket[]=[]; try{ items = text? JSON.parse(text):[] }catch{}; if(!Array.isArray(items)) items=(items as any)?.items??[];
  const now=new Date(); const from = gran==="day" ? new Date(now.getTime()-(isFinite(days)?days:14)*86400000)
                                                : new Date(now.getTime()-(isFinite(months)?months:6)*30*86400000);
  const inRange = items.filter(t=>{ const s=t.createdAt||t.updatedAt||""; const d=s? new Date(s):null; return d? d>=from: true; });
  const total=items.length; const today=items.filter(t=>(t.createdAt||"").slice(0,10)===now.toISOString().slice(0,10)).length;
  const statusCounts:Record<string,number>={}; for(const t of inRange){ const s=t.status||"unknown"; statusCounts[s]=(statusCounts[s]||0)+1; }
  const ser = new Map<string,number>(); for(const t of inRange){ const s=t.createdAt||t.updatedAt; if(!s) continue; const k= gran==="day"? s.slice(0,10): s.slice(0,7); ser.set(k,(ser.get(k)||0)+1); }
  const series = Array.from(ser.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count}));
  const ownersMap = new Map<string,number>(); for(const t of inRange){ const o=(t as any).owner||(t as any).assignedTo||(t as any).assignee||"unknown"; ownersMap.set(o,(ownersMap.get(o)||0)+1); }
  const owners = Array.from(ownersMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,value])=>({name,value}));
  return NextResponse.json({ total, today, statusCounts, owners, series }, { status:200 });
}