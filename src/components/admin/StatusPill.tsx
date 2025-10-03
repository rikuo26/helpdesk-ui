"use client";

export function StatusPill({status}:{status:"open"|"in_progress"|"done"|string}) {
  const color =
    status==="done"        ? "#16a34a" :
    status==="in_progress" ? "#f59e0b" : "#2563eb";
  const label =
    status==="done"        ? "done" :
    status==="in_progress" ? "in_progress" : "open";
  return (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:999,
      background: `${color}1A`, color, fontSize:12
    }}>{label}</span>
  );
}