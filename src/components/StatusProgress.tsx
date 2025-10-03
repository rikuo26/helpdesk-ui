"use client";
import React from "react";

export type StatusKey = "open"|"investigating"|"waiting"|"in_progress"|"done";

/** 表示順（左→右） */
const STEPS: { key: StatusKey; label: string }[] = [
  { key: "open",           label: "受付" },
  { key: "investigating",  label: "調査中" },
  { key: "waiting",        label: "対応待ち" },
  { key: "in_progress",    label: "対応中" },
  { key: "done",           label: "完了" },
];

export function normalizeStatus(s?: string): StatusKey {
  switch (s) {
    case "open": return "open";
    case "investigating": return "investigating";
    case "waiting": return "waiting";
    case "in_progress": return "in_progress";
    case "done":
    case "resolved":
    case "closed":
      return "done";
    default:
      return "open";
  }
}

export default function StatusProgress({
  current,
  editable,
  onChange,
}: {
  current?: string;
  editable?: boolean;
  onChange?: (next: StatusKey) => void;
}) {
  const now = normalizeStatus(current);
  const idx = STEPS.findIndex(s => s.key === now);
  const percent = Math.max(0, idx) * (100 / (STEPS.length - 1));

  return (
    <div className="mt-4">
      <div className="relative h-2.5 bg-gray-200 rounded-full">
        <div className="absolute h-2.5 bg-[#0078D4] rounded-full transition-all" style={{ width: `${percent}%` }} />
        <div className="absolute inset-0 flex justify-between items-center px-[2px]">
          {STEPS.map((s, i) => {
            const active = i <= idx;
            const cls = [
              "block w-5 h-5 rounded-full bg-white border-2",
              active ? "border-[#0078D4]" : "border-gray-300",
              editable ? "cursor-pointer hover:shadow" : "cursor-default",
            ].join(" ");
            return (
              <button
                key={s.key}
                type="button"
                className="relative flex items-center justify-center"
                style={{ width: 0 }}
                title={s.label}
                aria-label={s.label}
                onClick={editable && onChange ? () => onChange(s.key) : undefined}
              >
                <span className={cls} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-xs">
        {STEPS.map((s, i) => {
          const active = i <= idx;
          return (
            <span key={s.key} className={active ? "font-medium text-[#1f2937]" : "text-gray-500"} style={{ width: 0 }}>
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}


