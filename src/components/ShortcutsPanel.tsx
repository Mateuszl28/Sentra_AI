"use client";

import { Keyboard, X } from "lucide-react";
import { useEffect } from "react";

type Group = { title: string; items: { keys: string[]; label: string }[] };

const GROUPS: Group[] = [
  {
    title: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["?"], label: "Show this shortcuts panel" },
      { keys: ["Esc"], label: "Close any open dialog" },
    ],
  },
  {
    title: "Analyzer",
    items: [
      { keys: ["⌘", "Enter"], label: "Run analysis (when focused in textarea)" },
      { keys: ["Enter"], label: "Send a chat follow-up message" },
      { keys: ["⇧", "Enter"], label: "Newline in chat input" },
    ],
  },
  {
    title: "URL Inspector",
    items: [{ keys: ["Enter"], label: "Inspect URL (when focused in input)" }],
  },
  {
    title: "Command palette",
    items: [
      { keys: ["↑"], label: "Move selection up" },
      { keys: ["↓"], label: "Move selection down" },
      { keys: ["↵"], label: "Open selected action" },
    ],
  },
];

export function ShortcutsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close shortcuts"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative w-full max-w-xl surface-elev animate-fade-up overflow-hidden">
        <header className="flex items-center justify-between border-b hairline px-5 py-3">
          <div className="inline-flex items-center gap-2">
            <Keyboard size={15} className="text-sky-300" />
            <h2 className="text-sm font-semibold text-slate-100">
              Keyboard shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <X size={14} />
          </button>
        </header>
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin p-5 grid gap-5 sm:grid-cols-2">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="kicker mb-2">{g.title}</h3>
              <ul className="grid gap-1.5">
                {g.items.map((it) => (
                  <li
                    key={it.label}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-slate-300">{it.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {it.keys.map((k) => (
                        <kbd key={k} className="kbd">
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <footer className="border-t hairline px-5 py-2.5 text-[11px] text-muted">
          Tip · on Windows / Linux use{" "}
          <kbd className="kbd">Ctrl</kbd> instead of <kbd className="kbd">⌘</kbd>.
        </footer>
      </div>
    </div>
  );
}
