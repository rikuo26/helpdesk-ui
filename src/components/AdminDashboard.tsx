"use client";
import { useEffect, useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
type Stats = { total:number; today:number; statusCounts:Record<string,number>; owners:{name:string; value:number}[]; series:{date:string; count:number}[]; };
type UserRow = { owner:string; total:number; open:number; investigating:number; waiting:number; in_progress:number; done:number; };
type UsersResp = { granularity:"day"|"month"; range:number; rows:UserRow[] };
const STATUS_LABEL: Record<string,string> = { open:"蜿嶺ｻ・, investigating:"隱ｿ譟ｻ荳ｭ", waiting:"蟇ｾ蠢懷ｾ・■", in_progress:"蟇ｾ蠢應ｸｭ", done:"螳御ｺ・, unknown:"荳肴・" };
const BRAND = { primary:"#0078D4", primaryDark:"#005A9E", accent:"#1496FF", accent2:"#61A0FF", green:"#22C55E", orange:"#F59E0B", yellow:"#EAB308", gray:"#6B7280" };
const PIE_COLORS = [BRAND.primary, BRAND.accent, BRAND.accent2, BRAND.primaryDark, "#00B7C3"];
export default function AdminDashboard(){
  const [mode,setMode]=useState<"day"|"month">("day"); const [days,setDays]=useState(14); const [months,setMonths]=useState(6);
  const [stats,setStats]=useState<Stats|null>(null); const [users,setUsers]=useState<UsersResp|null>(null); const [err,setErr]=useState("");
  async function fetchJson<T>(url:string){ const r=await fetch(url,{cache:"no-store"}); const text=await r.text(); if(!r.ok) throw new Error(`GET ${url} -> ${r.status} ${text?.slice(0,200)}`); try{ return text? JSON.parse(text) as T : ({} as T);}catch{ throw new Error(`Invalid JSON from ${url}`);} }
  async function load(){ setErr(""); const qS = mode==="day"? `/api/tickets/stats?granularity=day&days=${days}` : `/api/tickets/stats?granularity=month&months=${months}`;
    const qU = mode==="day"? `/api/tickets/stats/users?granularity=day&days=${days}` : `/api/tickets/stats/users?granularity=month&months=${months}`;
    const [s,u]=await Promise.allSettled([fetchJson<Stats>(qS), fetchJson<UsersResp>(qU)]); if(s.status==="fulfilled") setStats(s.value); else { setStats(null); setErr((e)=> (e?e+"\n":"") + (s.reason?.message || "stats error")); }
    if(u.status==="fulfilled") setUsers(u.value); else { setUsers(null); setErr((e)=> (e?e+"\n":"") + (u.reason?.message || "users error")); }
  }
  useEffect(()=>{ load(); }, [mode,days,months]);
  const statusData = useMemo(()=> Object.entries(stats?.statusCounts??{}).map(([k,v])=>({status: STATUS_LABEL[k]??k, count:v})), [stats]);
  const userChartData = useMemo(()=> (users?.rows??[]).map(r=>({ owner:r.owner, 蜷郁ｨ・r.total, 蜿嶺ｻ・r.open, 隱ｿ譟ｻ荳ｭ:r.investigating, 蟇ｾ蠢懷ｾ・■:r.waiting, 蟇ｾ蠢應ｸｭ:r.in_progress, 螳御ｺ・r.done })), [users]);
  const seriesTotal = (stats?.series??[]).reduce((a,b)=>a+b.count,0);
  return (<div className="space-y-6">
    {!!err && <div className="text-sm text-red-700 whitespace-pre-wrap">Dashboard error: {err}</div>}
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-xl border overflow-hidden">
        <button className={`px-3 py-1.5 text-sm ${mode==="day" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={()=>setMode("day")}>譌･谺｡</button>
        <button className={`px-3 py-1.5 text-sm border-l ${mode==="month" ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={()=>setMode("month")}>譛域ｬ｡</button>
      </div>
      {mode==="day" ? (
        <div className="inline-flex rounded-xl border overflow-hidden">
          {[7,14,30,90].map(v=> <button key={v} className={`px-3 py-1.5 text-sm ${days===v ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={()=>setDays(v)}>{v}譌･</button>)}
        </div>
      ) : (
        <div className="inline-flex rounded-xl border overflow-hidden">
          {[3,6,12].map(v=> <button key={v} className={`px-3 py-1.5 text-sm ${months===v ? "bg-[#E6F2FB] text-[#0f5ea8]" : "bg-white hover:bg-gray-50"}`} onClick={()=>setMonths(v)}>{v}繝ｶ譛・/button>)}
        </div>
      )}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KpiCard label="邱上メ繧ｱ繝・ヨ謨ｰ" value={stats?.total??0} />
      <KpiCard label="譛ｬ譌･菴懈・" value={stats?.today??0} />
      <KpiCard label={mode==="day" ? `${days}譌･蜷郁ｨ・ : `${months}繝ｶ譛亥粋險・} value={seriesTotal} />
    </div>
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <div className="font-semibold mb-2">繧ｹ繝・・繧ｿ繧ｹ蛻･莉ｶ謨ｰ</div>
      <div style={{width:"100%",height:260}}>
        <ResponsiveContainer>
          <BarChart data={statusData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="status"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" fill={BRAND.primary} stroke={BRAND.primaryDark}/></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <div className="font-semibold mb-2">{mode==="day"?"譌･谺｡謗ｨ遘ｻ":"譛域ｬ｡謗ｨ遘ｻ"}</div>
      <div style={{width:"100%",height:260}}>
        <ResponsiveContainer>
          <AreaChart data={stats?.series??[]}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/><Area type="monotone" dataKey="count" stroke={BRAND.primary} fill={BRAND.accent} fillOpacity={0.35}/></AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-white border rounded-2xl p-4 shadow-sm">
      <div className="font-semibold mb-2">謇譛芽・ヨ繝・・5</div>
      <div style={{width:"100%",height:260}}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={stats?.owners??[]} dataKey="value" nameKey="name" outerRadius={90} isAnimationActive>
              {(stats?.owners??[]).map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
            </Pie><Legend/><Tooltip/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
    {users && users.rows.length>0 && (<>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">繝ｦ繝ｼ繧ｶ繝ｼ蛻･ 髮・ｨ・/h2>
        <button onClick={()=>{ const q=mode==="day"? `/api/tickets/stats/users?granularity=day&days=${days}&format=csv` : `/api/tickets/stats/users?granularity=month&months=${months}&format=csv`; const a=document.createElement("a"); a.href=q; a.download=""; document.body.appendChild(a); a.click(); a.remove(); }} className="px-3 py-1.5 text-sm rounded-xl border hover:bg-[#E6F2FB]">CSV繝繧ｦ繝ｳ繝ｭ繝ｼ繝・/button>
      </div>
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="font-semibold mb-2">繝ｦ繝ｼ繧ｶ繝ｼ蛻･ 莉ｶ謨ｰ・亥粋險茨ｼ・/div>
        <div style={{width:"100%",height:360}}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={userChartData.slice(0,15)}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="owner" width={160}/><Tooltip/><Legend/><Bar dataKey="蜷郁ｨ・ fill={BRAND.primary}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="font-semibold mb-2">繝ｦ繝ｼ繧ｶ繝ｼ蛻･ 繧ｹ繝・・繧ｿ繧ｹ蜀・ｨｳ</div>
        <div style={{width:"100%",height:420}}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={userChartData.slice(0,15)}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="owner" width={160}/><Tooltip/><Legend/><Bar dataKey="蜿嶺ｻ・ stackId="a" fill={BRAND.gray}/><Bar dataKey="隱ｿ譟ｻ荳ｭ" stackId="a" fill={BRAND.orange}/><Bar dataKey="蟇ｾ蠢懷ｾ・■" stackId="a" fill={BRAND.yellow}/><Bar dataKey="蟇ｾ蠢應ｸｭ" stackId="a" fill={BRAND.primary}/><Bar dataKey="螳御ｺ・ stackId="a" fill={BRAND.green}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-[880px] w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-4 py-2">繝ｦ繝ｼ繧ｶ繝ｼ</th><th className="text-right px-4 py-2">蜷郁ｨ・/th><th className="text-right px-4 py-2">蜿嶺ｻ・/th><th className="text-right px-4 py-2">隱ｿ譟ｻ荳ｭ</th><th className="text-right px-4 py-2">蟇ｾ蠢懷ｾ・■</th><th className="text-right px-4 py-2">蟇ｾ蠢應ｸｭ</th><th className="text-right px-4 py-2">螳御ｺ・/th></tr></thead>
          <tbody>{(users.rows??[]).slice(0,50).map(r=>(<tr key={r.owner} className="border-t hover:bg-gray-50"><td className="px-4 py-2">{r.owner}</td><td className="px-4 py-2 text-right">{r.total}</td><td className="px-4 py-2 text-right">{r.open}</td><td className="px-4 py-2 text-right">{r.investigating}</td><td className="px-4 py-2 text-right">{r.waiting}</td><td className="px-4 py-2 text-right">{r.in_progress}</td><td className="px-4 py-2 text-right">{r.done}</td></tr>))}</tbody>
        </table>
      </div>
    </>)}
  </div>);
}

