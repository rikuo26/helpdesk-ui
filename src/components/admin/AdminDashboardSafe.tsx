"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { normalizeStats, type Norm } from "./_statsAdapter";
import { BarChart, SparklineChart } from "./Charts";

function Card({title, value, suffix=""}:{title:string; value:string|number; suffix?:string}) {
  return (
    <div style={{border:"1px solid #e5e7eb", borderRadius:8, padding:16, background:"#fff"}}>
      <div style={{fontSize:12, color:"#6b7280"}}>{title}</div>
      <div style={{fontSize:24, fontWeight:600}}>{value}{suffix}</div>
    </div>
  );
}

export default function AdminDashboardSafe() {
  const sp = useSearchParams();
  const days = Math.max(1, Number(sp?.get("days") ?? 14));
  const [vm, setVm] = useState<Norm|null>(null);

  useEffect(()=> {
    let aborted = false;
    (async()=>{
      const raw = await apiGet(`/tickets/stats?days=${days}`, { fallback:{} as any });
      let model = normalizeStats(raw);
      if (!model.users?.length) {
        const u = await apiGet(`/tickets/stats/users?days=${days}`, { fallback: [] as any });
        const arr = Array.isArray(u) ? u : Array.isArray(u?.items) ? u.items : [];
        model = {...model, users: arr.map((it:any)=>({ name:String(it.name ?? "unknown"), count:Number(it.count ?? it.total ?? 0) }))};
      }
      if (!aborted) setVm(model);
    })();
    return ()=>{ aborted = true; };
  }, [days]);

  if (!vm) return <div style={{padding:16, color:"#6b7280"}}>読み込み中...</div>;

  const t = vm.totals;
  const usersTop = vm.users.slice(0,10);

  return (
    <div style={{padding:16}}><div style={{display:"flex",justifyContent:"flex-end",gap:12,marginBottom:8}}><a href="/admin/tickets/manage" style={{color:"#2563eb"}}>管理ページ</a><a href="/admin/tickets/list" style={{color:"#2563eb"}}>一覧</a></div><div style={{display:"flex",justifyContent:"flex-end"}}><a href="/admin/tickets/list" style={{color:"#2563eb"}}>一覧・編集へ</a></div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(6, minmax(0, 1fr))", gap:12}}>
        <Card title="総件数（現在）" value={t.totalCount}/>
        <Card title="本日新規" value={t.todayCount}/>
        <Card title={`${days}日平均/日`} value={t.avgPerDay}/>
        <Card title="完了率" value={t.completionRate} suffix="%"/>
        <Card title="未解決率" value={t.unresolvedRate} suffix="%"/>
        <Card title="担当者あたり保有（平均）" value={t.avgUnresolvedPerUser}/>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12}}>
        <div style={{border:"1px solid #e5e7eb", borderRadius:8, padding:16, background:"#fff"}}>
          <div style={{fontSize:14, fontWeight:600, marginBottom:8}}>ステータス内訳</div>
          <div style={{display:"grid", gridTemplateColumns:"auto 1fr auto", rowGap:6, columnGap:8, maxWidth:360}}>
            <div>open</div><div style={{height:8, background:"#e5e7eb", borderRadius:4}}><div style={{width:`${vm.statusCounts.open / Math.max(1, t.totalCount) * 100}%`, height:"100%", background:"#2563eb", borderRadius:4}}/></div><div>{vm.statusCounts.open}</div>
            <div>in_progress</div><div style={{height:8, background:"#e5e7eb", borderRadius:4}}><div style={{width:`${vm.statusCounts.in_progress / Math.max(1, t.totalCount) * 100}%`, height:"100%", background:"#2563eb", borderRadius:4}}/></div><div>{vm.statusCounts.in_progress}</div>
            <div>done</div><div style={{height:8, background:"#e5e7eb", borderRadius:4}}><div style={{width:`${vm.statusCounts.done / Math.max(1, t.totalCount) * 100}%`, height:"100%", background:"#2563eb", borderRadius:4}}/></div><div>{vm.statusCounts.done}</div>
            <div>未解決</div><div style={{height:8, background:"#e5e7eb", borderRadius:4}}><div style={{width:`${vm.statusCounts.unresolved / Math.max(1, t.totalCount) * 100}%`, height:"100%", background:"#2563eb", borderRadius:4}}/></div><div>{vm.statusCounts.unresolved}</div>
          </div>
        </div>

        <div style={{border:"1px solid #e5e7eb", borderRadius:8, padding:16, background:"#fff"}}>
          <div style={{fontSize:14, fontWeight:600, marginBottom:8}}>件数推移（{days}日）</div>
          <SparklineChart labels={vm.daily.labels} data={vm.daily.series} height={120}/>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12}}>
        <div style={{border:"1px solid #e5e7eb", borderRadius:8, padding:16, background:"#fff"}}>
          <div style={{fontSize:14, fontWeight:600, marginBottom:8}}>曜日分布（期間内の新規）</div>
          <BarChart labels={vm.weekday.labels} data={vm.weekday.series} height={160}/>
        </div>

        <div style={{border:"1px solid #e5e7eb", borderRadius:8, padding:16, background:"#fff"}}>
          <div style={{fontSize:14, fontWeight:600, marginBottom:8}}>トップ担当者（{days}日・総数）</div>
          <BarChart labels={usersTop.map(u=>u.name)} data={usersTop.map(u=>u.count)} height={160}/>
        </div>
      </div>
    </div>
  );
}

