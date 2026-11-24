"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { IconCheck } from "./Icons";

const ToastContext = createContext({
  addToast: () => {},
  removeToast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast = { id, type, title, message };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (title, message, duration) => addToast({ type: "success", title, message, duration }),
    [addToast]
  );
  const error = useCallback(
    (title, message, duration) => addToast({ type: "error", title, message, duration }),
    [addToast]
  );
  const warning = useCallback(
    (title, message, duration) => addToast({ type: "warning", title, message, duration }),
    [addToast]
  );
  const info = useCallback(
    (title, message, duration) => addToast({ type: "info", title, message, duration }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all transform duration-300 ease-out flex items-start gap-3 ${
              t.type === "success"
                ? "bg-slate-900/90 border-emerald-500/40 text-white shadow-emerald-500/10"
                : t.type === "error"
                ? "bg-slate-900/90 border-rose-500/40 text-white shadow-rose-500/10"
                : t.type === "warning"
                ? "bg-slate-900/90 border-amber-500/40 text-white shadow-amber-500/10"
                : "bg-slate-900/90 border-blue-500/40 text-white shadow-blue-500/10"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                t.type === "success"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : t.type === "error"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : t.type === "warning"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}
            >
              {t.type === "success" && <IconCheck className="w-4 h-4" />}
              {t.type === "error" && "✕"}
              {t.type === "warning" && "!"}
              {t.type === "info" && "ℹ"}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <h4 className="text-xs font-bold text-white tracking-wide">{t.title}</h4>}
              {t.message && (
                <p className="text-[11px] text-blue-100/70 mt-0.5 leading-relaxed break-words">
                  {t.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer transition"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
