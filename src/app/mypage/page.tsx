"use client";
import { useSearchParams } from "next/navigation";
import MyTicketsView from "@/components/mypage/MyTicketsView";
import TicketsTable from "@/components/TicketsTable";

const link = {
  padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:8,
  color:"#2563eb", textDecoration:"none", fontSize:12
} as const;
const linkActive = {
  ...link, background:"#2563eb", color:"#fff", borderColor:"#2563eb"
} as const;

export default function MyPage(){
  const sp = useSearchParams();
  const style = (sp?.get("style") ?? "cards").toLowerCase();
  const scope = ((sp?.get("scope") ?? "mine").toLowerCase() === "all") ? "all" : "mine";

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
        <h1 style={{fontSize:18, fontWeight:800}}>マイページ</h1>
        <div style={{display:"flex", gap:8}}>
          <a href={`/mypage?scope=${scope}&style=cards`} style={style==="cards"?linkActive:link}>カード</a>
          <a href={`/mypage?scope=${scope}&style=table`} style={style==="table"?linkActive:link}>表</a>
          <a href={`/mypage?scope=${scope==="mine"?"all":"mine"}&style=${style}`} style={link}>
            {scope==="mine" ? "すべてを見る" : "自分のチケット"}
          </a>
        </div>
      </div>

      {style==="table" ? <TicketsTable/> : <MyTicketsView scope={scope as "mine"|"all"} />}
    </div>
  );
}