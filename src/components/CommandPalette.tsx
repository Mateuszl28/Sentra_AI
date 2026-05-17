"use client";

import {
  Clock,
  CornerDownLeft,
  Link2,
  Mail,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MODES, type Mode } from "./Sidebar";
import type { HistoryEntry } from "@/lib/useHistory";

type Action = {
  id: string;
  label: string;
  hint?: string;
  kind: "mode" | "history-email" | "history-url";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
  mode,
  onModeChange,
  history,
  onOpenEmail,
  onOpenUrl,
}: {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  history: HistoryEntry[];
  onOpenEmail: (raw: string) => void;
  onOpenUrl: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setQuery("");
      setActive(0);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  const actions: Action[] = useMemo(() => {
    const modeActions: Action[] = MODES.map((m) => ({
      id: `mode-${m.id}`,
      label: `Go to ${m.label}`,
      hint: m.hint,
      kind: "mode",
      icon: m.icon,
      run: () => {
        onModeChange(m.id);
        onClose();
      },
    }));
    const histActions: Action[] = history.slice(0, 12).map((h) => ({
      id: `hist-${h.id}`,
      label: h.label,
      hint: `${h.verdict} · ${h.kind === "email" ? "email" : "URL"} · ${h.riskScore}/100`,
      kind: h.kind === "email" ? "history-email" : "history-url",
      icon: h.kind === "email" ? Mail : Link2,
      run: () => {
        if (h.kind === "email") onOpenEmail(h.payload);
        else onOpenUrl(h.payload);
        onClose();
      },
    }));
    return [...modeActions, ...histActions];
  }, [history, onClose, onModeChange, onOpenEmail, onOpenUrl]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) =>
      `${a.label} ${a.hint ?? ""}`.toLowerCase().includes(q),
    );
  }, [actions, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[active]?.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose]);

  if (!open) return null;

  const groups: { title: string; items: Action[] }[] = [
    { title: "Modes", items: filtered.filter((a) => a.kind === "mode") },
    {
      title: "History",
      items: filtered.filter((a) => a.kind !== "mode"),
    },
  ].filter((g) => g.items.length > 0);

  let cursor = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative w-full max-w-xl surface-elev animate-fade-up overflow-hidden">
        <div className="flex items-center gap-2 border-b hairline px-3 py-2.5">
          <Search size={14} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Jump to a mode or recent analysis…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <span className="hidden sm:inline rounded border hairline px-1.5 py-0.5 font-mono text-[10px] text-muted">
            esc
          </span>
        </div>

        <div className="max-h-[55vh] overflow-y-auto scrollbar-thin p-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-6 py-10 text-center text-sm text-muted">
              <Search size={20} className="text-slate-700" />
              No matches.
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.title} className="mb-1.5">
                <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                  {g.title}
                </div>
                <ul>
                  {g.items.map((a) => {
                    const idx = cursor++;
                    const isActive = idx === active;
                    const Icon = a.icon;
                    const isCurrentMode =
                      a.kind === "mode" && a.id === `mode-${mode}`;
                    return (
                      <li key={a.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => a.run()}
                          className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                            isActive
                              ? "bg-slate-100/[0.06] text-slate-100"
                              : "text-slate-300"
                          }`}
                        >
                          <Icon
                            size={14}
                            className={isActive ? "text-sky-300" : "text-slate-500"}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{a.label}</div>
                            {a.hint ? (
                              <div className="truncate text-[11px] text-muted">
                                {a.hint}
                              </div>
                            ) : null}
                          </div>
                          {isCurrentMode ? (
                            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                              current
                            </span>
                          ) : null}
                          {a.kind !== "mode" ? (
                            <Clock size={11} className="text-slate-600" />
                          ) : null}
                          {isActive ? (
                            <CornerDownLeft size={11} className="text-slate-500" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t hairline px-3 py-2 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={10} className="text-sky-400" /> Sentra · client-side
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border hairline px-1 py-0.5 font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border hairline px-1 py-0.5 font-mono">↵</kbd>
              open
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
