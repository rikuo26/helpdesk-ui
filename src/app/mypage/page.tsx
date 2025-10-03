import TicketsGrid from "@/components/TicketsGrid";
import Link from "next/link";

type SP = { scope?: string };

export default async function MyPage(
  { searchParams }: { searchParams: Promise<SP> }
) {
  const sp = await searchParams;
  const s = sp?.scope;
  const scope: "mine" | "all" = (s === "mine" || s === "all") ? s : "all"; // 既定=all
  return (
    <div className="space-y-4" style={{ padding: 16 }}>
      <h1 className="text-xl font-semibold">マイページ</h1>
      <nav style={{display:"flex", gap:8, marginBottom:8}}>
        <Link href="/mypage?scope=mine" prefetch>自分の</Link>
        <Link href="/mypage?scope=all"  prefetch>すべて</Link>
      </nav>
      <TicketsGrid scope={scope} />
    </div>
  );
}