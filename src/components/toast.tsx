"use client";
import React from "react";

type ToastType = "info"|"success"|"error";
let notify: ((type: ToastType, msg: string) => void) | null = null;

export function ToastContainer() {
  const [items, setItems] = React.useState<{ id: number; type: ToastType; msg: string }[]>([]);
  const seqRef = React.useRef(0);

  React.useEffect(() => {
    notify = (type, msg) => {
      const id = seqRef.current++;
      setItems(prev => [...prev, { id, type, msg }]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 2500);
    };
    return () => { notify = null; };
  }, []);

  const color = (t: ToastType) =>
    t==="success" ? "border-green-600 bg-green-50 text-green-800"
    : t==="error" ? "border-red-600 bg-red-50 text-red-800"
    : "border-[#0f5ea8] bg-[#E6F2FB] text-[#0f5ea8]";

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {items.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded-xl shadow border ${color(t.type)}`}>
          <span className="text-sm">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

export const toast = {
  info:   (m: string) => notify?.("info", m),
  success:(m: string) => notify?.("success", m),
  error:  (m: string) => notify?.("error", m),
};
