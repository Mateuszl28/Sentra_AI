"use client";

import {
  ChevronRight,
  Github,
  History as HistoryIcon,
  Keyboard,
  ShieldCheck,
} from "lucide-react";
import { MODES, type Mode } from "./Sidebar";

export function Topbar({
  mode,
  historyTotal,
  phishyTotal,
  onOpenHistory,
  onOpenCommandPalette,
  onOpenShortcuts,
}: {
  mode: Mode;
  historyTotal: number;
  phishyTotal: number;
  onOpenHistory: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
}) {
  const active = MODES.find((m) => m.id === mode);
  const ActiveIcon = active?.icon ?? ShieldCheck;
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b hairline bg-[rgba(5,8,22,0.65)] px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2 text-sm text-slate-300 min-w-0">
        <ShieldCheck size={14} className="text-sky-300 shrink-0" />
        <span className="hidden sm:inline font-medium text-slate-100">Sentra</span>
        <ChevronRight size={12} className="hidden sm:inline text-slate-600" />
        <span className="inline-flex items-center gap-1.5 truncate">
          <ActiveIcon size={13} className="text-slate-400" />
          <span className="truncate text-slate-100">{active?.label ?? "Workbench"}</span>
        </span>
        <span className="hidden md:inline truncate text-xs text-muted">
          · {active?.hint ?? ""}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          title="Command palette"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md border hairline bg-slate-950/40 px-2 py-1 text-[11px] text-muted transition hover:bg-slate-900/70 hover:text-slate-200"
        >
          <Keyboard size={11} />
          <span className="font-mono">⌘K</span>
        </button>
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
          className="hidden md:inline-flex items-center justify-center rounded-md border hairline bg-slate-950/40 px-2 py-1 text-[11px] text-muted transition hover:bg-slate-900/70 hover:text-slate-200"
        >
          <span className="font-mono">?</span>
        </button>
        <button
          type="button"
          onClick={onOpenHistory}
          title="Session history (last 25 analyses)"
          className="inline-flex items-center gap-1.5 rounded-md border hairline bg-slate-950/40 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-slate-900/70"
        >
          <HistoryIcon size={12} />
          <span className="font-mono tabular-nums">{historyTotal}</span>
          {phishyTotal > 0 ? (
            <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-rose-500/15 px-1.5 py-px text-[9px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/30">
              <span className="h-1 w-1 rounded-full bg-rose-400" />
              {phishyTotal}
            </span>
          ) : null}
        </button>
        <a
          href="https://github.com/Mateuszl28/Sentra_AI"
          target="_blank"
          rel="noopener noreferrer"
          title="View source on GitHub"
          className="inline-flex items-center gap-1.5 rounded-md border hairline bg-slate-950/40 px-2.5 py-1 text-xs text-slate-200 transition hover:bg-slate-900/70"
        >
          <Github size={12} />
          <span className="hidden sm:inline">Source</span>
        </a>
      </div>
    </header>
  );
}
