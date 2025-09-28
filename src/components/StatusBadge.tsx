export type StatusKey = "open"|"investigating"|"waiting"|"in_progress"|"done";

const MAP: Record<StatusKey, { text: string; cls: string }> = {
  open:           { text: "受付",     cls: "text-gray-700 border-gray-400 bg-gray-100" },
  investigating:  { text: "調査中",   cls: "text-orange-700 border-orange-500 bg-orange-50" },
  waiting:        { text: "対応待ち", cls: "text-yellow-700 border-yellow-500 bg-yellow-50" },
  in_progress:    { text: "対応中",   cls: "text-[#0f5ea8] border-[#0f5ea8] bg-[#E6F2FB]" },
  done:           { text: "完了",     cls: "text-green-800 border-green-600 bg-green-50" },
};

export default function StatusBadge({ value }: { value?: string }) {
  const v = (["open","investigating","waiting","in_progress","done"].includes(String(value)) ? value : "open") as StatusKey;
  const { text, cls } = MAP[v];
  return <span className={`text-xs rounded-full px-2 py-0.5 border ${cls}`}>{text}</span>;
}


