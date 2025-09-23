"use client";
import React from "react";

let notify: ((type: "info"|"success"|"error", msg: string) => void) | null = null;

export function ToastContainer() {
  const [items, setItems] = React.useState<{ id: number; type: string; msg: string }[]>([]);
  const seqRef = React.useRef(0);

  React.useEffect(() => {
    notify = (type, msg) => {
      const id = seqRef.current++;
      setItems(prev => [...prev, { id, type, msg }]);
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 2500);
    };
    return () => { notify = null; };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {items.map(t => (
        <div key={t.id} className="px-4 py-2 rounded-lg shadow bg-white border">
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
