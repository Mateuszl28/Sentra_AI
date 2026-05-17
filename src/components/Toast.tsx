"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type ToastTone = "success" | "error" | "info";
export type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => undefined,
      dismiss: () => undefined,
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++counterRef.current;
      setItems((curr) => [...curr, { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const palette =
    toast.tone === "success"
      ? {
          ring: "ring-emerald-400/40",
          icon: "text-emerald-300",
          Icon: CheckCircle2,
        }
      : toast.tone === "error"
        ? { ring: "ring-rose-400/40", icon: "text-rose-300", Icon: AlertCircle }
        : { ring: "ring-sky-400/40", icon: "text-sky-300", Icon: Info };
  const Icon = palette.Icon;
  return (
    <div
      role="status"
      className={`pointer-events-auto surface-elev animate-fade-up flex w-full items-start gap-3 p-3 ring-1 ring-inset ${palette.ring}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${palette.icon}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-100">{toast.title}</div>
        {toast.body ? (
          <div className="mt-0.5 text-xs leading-relaxed text-slate-300">
            {toast.body}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
      >
        <X size={12} />
      </button>
    </div>
  );
}
