"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Tiny toast hook: const { toast, showToast } = useToast();  ...  {toast} */
export function useToast(durationMs = 2800) {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback(
    (text, type = "success") => {
      setMessage({ text, type });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const toast = message ? (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-2xl ${
        message.type === "error" ? "bg-rose-600" : message.type === "info" ? "bg-stone-800" : "bg-[#162B22]"
      }`}
    >
      {message.type === "error" ? "⚠️ " : message.type === "info" ? "ℹ️ " : "✅ "}
      {message.text}
    </div>
  ) : null;

  return { toast, showToast };
}
