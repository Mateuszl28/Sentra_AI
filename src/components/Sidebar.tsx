"use client";

import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Inbox,
  Keyboard,
  Link2,
  ScanSearch,
  SplitSquareHorizontal,
} from "lucide-react";
import { Logo } from "./Logo";

export type Mode =
  | "analyze"
  | "url"
  | "compare"
  | "train"
  | "inbox"
  | "anatomy"
  | "insights";

export const MODES: {
  id: Mode;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  group: "analyze" | "learn";
}[] = [
  { id: "analyze", label: "Analyzer", hint: "Paste an email", icon: ScanSearch, group: "analyze" },
  { id: "url", label: "URL Inspector", hint: "Inspect a link", icon: Link2, group: "analyze" },
  { id: "compare", label: "Compare", hint: "A vs B", icon: SplitSquareHorizontal, group: "analyze" },
  { id: "train", label: "Train", hint: "Practice quiz", icon: GraduationCap, group: "learn" },
  { id: "inbox", label: "Inbox Sim", hint: "Triage drill", icon: Inbox, group: "learn" },
  { id: "anatomy", label: "Anatomy", hint: "Guided walkthrough", icon: BookOpen, group: "learn" },
  { id: "insights", label: "Insights", hint: "Your data, charted", icon: BarChart3, group: "learn" },
];

export function Sidebar({
  mode,
  onChange,
  onOpenCommandPalette,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  onOpenCommandPalette: () => void;
}) {
  const analyze = MODES.filter((m) => m.group === "analyze");
  const learn = MODES.filter((m) => m.group === "learn");
  return (
    <aside className="hidden md:flex md:w-[220px] lg:w-[240px] shrink-0 flex-col gap-4 border-r hairline px-3 py-5 sticky top-0 h-screen">
      <div className="px-2">
        <Logo />
      </div>

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="mx-2 mt-1 inline-flex items-center gap-2 rounded-lg border hairline-strong bg-slate-950/40 px-2.5 py-1.5 text-xs text-muted transition hover:bg-slate-900/70 hover:text-slate-200"
      >
        <span className="inline-flex items-center gap-1.5">
          <Keyboard size={12} /> Quick switch
        </span>
        <span className="ml-auto inline-flex items-center gap-0.5 rounded border hairline px-1.5 py-0.5 font-mono text-[10px]">
          <span>⌘</span>K
        </span>
      </button>

      <NavGroup title="Workbench">
        {analyze.map((m) => (
          <NavItem
            key={m.id}
            active={mode === m.id}
            label={m.label}
            hint={m.hint}
            icon={m.icon}
            onClick={() => onChange(m.id)}
          />
        ))}
      </NavGroup>

      <NavGroup title="Learn">
        {learn.map((m) => (
          <NavItem
            key={m.id}
            active={mode === m.id}
            label={m.label}
            hint={m.hint}
            icon={m.icon}
            onClick={() => onChange(m.id)}
          />
        ))}
      </NavGroup>

      <div className="mt-auto px-2 pb-1">
        <div className="rounded-lg border hairline bg-slate-950/40 px-3 py-2 text-[10px] text-muted">
          <div className="flex items-center gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono uppercase tracking-[0.18em] text-emerald-300/80">
              Online · Gemini 2.5 Flash
            </span>
          </div>
          <p className="mt-1 leading-snug">No accounts. No logs. History stays on this device.</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileTabStrip({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <nav className="md:hidden -mx-5 mt-3 mb-1 overflow-x-auto scrollbar-thin">
      <div className="flex w-max items-center gap-1 px-5">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950"
                  : "border hairline bg-slate-950/40 text-slate-300 hover:bg-slate-900/70"
              }`}
            >
              <Icon size={12} />
              {m.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {title}
      </div>
      <ul className="grid gap-0.5">{children}</ul>
    </div>
  );
}

function NavItem({
  active,
  label,
  hint,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
          active
            ? "bg-slate-100/[0.04] text-slate-100"
            : "text-slate-300 hover:bg-slate-100/[0.025] hover:text-slate-100"
        }`}
      >
        {active ? (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-400 to-cyan-400" />
        ) : null}
        <Icon
          size={14}
          strokeWidth={2.2}
          className={active ? "text-sky-300" : "text-slate-400 group-hover:text-slate-200"}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-tight">{label}</div>
          <div className="mt-0.5 text-[10.5px] leading-tight text-muted">{hint}</div>
        </div>
      </button>
    </li>
  );
}
