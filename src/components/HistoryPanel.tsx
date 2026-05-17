"use client";

import {
  Clock,
  History as HistoryIcon,
  Link2,
  Mail,
  Trash2,
  X,
} from "lucide-react";
import { useEffect } from "react";
import type { HistoryEntry } from "@/lib/useHistory";

const VERDICT_PILL: Record<string, string> = {
  SAFE: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  SUSPICIOUS: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  PHISHING: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  MALICIOUS: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

export function HistoryPanel({
  open,
  onClose,
  entries,
  onOpenEmail,
  onOpenUrl,
  onClear,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onOpenEmail: (raw: string) => void;
  onOpenUrl: (url: string) => void;
  onClear: () => void;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      <button
        type="button"
        aria-label="Close history"
        onClick={onClose}
        className="flex-1 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="inline-flex items-center gap-2">
            <HistoryIcon size={16} className="text-sky-300" />
            <h2 className="text-sm font-semibold text-slate-100">
              Session history
            </h2>
            <span className="text-xs text-slate-500">
              ({entries.length}/25)
            </span>
          </div>
          <div className="flex items-center gap-1">
            {entries.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear all history? This can't be undone.")) {
                    onClear();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-900 hover:text-rose-300"
              >
                <Trash2 size={11} /> clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {entries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Clock
                size={28}
                className="mx-auto text-slate-700"
                strokeWidth={1.5}
              />
              <p className="mt-3 text-sm text-slate-400">
                Nothing here yet. Your last 25 analyses will appear here
                automatically.
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Stored locally in your browser — never leaves this device.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-900/60"
                >
                  <div className="mt-1 shrink-0 text-slate-500">
                    {e.kind === "email" ? (
                      <Mail size={14} />
                    ) : (
                      <Link2 size={14} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (e.kind === "email") onOpenEmail(e.payload);
                      else onOpenUrl(e.payload);
                      onClose();
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${
                          VERDICT_PILL[e.verdict] ?? VERDICT_PILL.SUSPICIOUS
                        }`}
                      >
                        {e.verdict}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500">
                        {e.riskScore}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-500">
                        {timeAgo(e.timestamp)}
                      </span>
                    </div>
                    <p
                      className="mt-1 truncate text-sm text-slate-200"
                      title={e.label}
                    >
                      {e.label}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      Click to re-open in {e.kind === "email" ? "Analyzer" : "URL Inspector"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(e.id)}
                    aria-label="Remove"
                    className="shrink-0 rounded-md p-1 text-slate-600 opacity-0 transition-opacity hover:bg-slate-900 hover:text-rose-300 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(ts).toLocaleDateString();
}
