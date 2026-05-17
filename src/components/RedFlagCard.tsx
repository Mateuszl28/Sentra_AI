"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Info,
} from "lucide-react";
import type { LlmRedFlag, Severity } from "@/lib/types";

const SEVERITY_STYLES = {
  high: {
    ring: "ring-rose-500/30",
    hoverRing: "hover:ring-rose-400/60",
    pill: "bg-rose-500/20 text-rose-200",
    bar: "bg-rose-400",
    Icon: AlertTriangle,
  },
  medium: {
    ring: "ring-amber-500/30",
    hoverRing: "hover:ring-amber-400/60",
    pill: "bg-amber-500/20 text-amber-200",
    bar: "bg-amber-400",
    Icon: AlertCircle,
  },
  low: {
    ring: "ring-sky-500/30",
    hoverRing: "hover:ring-sky-400/60",
    pill: "bg-sky-500/20 text-sky-200",
    bar: "bg-sky-400",
    Icon: Info,
  },
  info: {
    ring: "ring-slate-500/30",
    hoverRing: "hover:ring-slate-400/60",
    pill: "bg-slate-500/20 text-slate-200",
    bar: "bg-slate-400",
    Icon: Info,
  },
} as const satisfies Record<
  Severity,
  {
    ring: string;
    hoverRing: string;
    pill: string;
    bar: string;
    Icon: typeof AlertTriangle;
  }
>;

export function RedFlagCard({
  flag,
  index,
  onFocus,
  isFocused,
}: {
  flag: LlmRedFlag;
  index: number;
  onFocus?: () => void;
  isFocused?: boolean;
}) {
  const s = SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.medium;
  const Icon = s.Icon;
  const clickable = !!onFocus && !!flag.evidence;
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : -1}
      onClick={clickable ? onFocus : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFocus?.();
              }
            }
          : undefined
      }
      className={`surface group relative overflow-hidden ring-1 ring-inset p-5 transition-all duration-200 ${s.ring} ${
        clickable ? `cursor-pointer ${s.hoverRing} hover:-translate-y-0.5` : ""
      } ${isFocused ? "ring-2 ring-offset-2 ring-offset-slate-950" : ""}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${s.bar}`} />
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.pill}`}
        >
          <Icon size={16} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-[15px] font-semibold leading-tight text-slate-50">
              {flag.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.pill}`}
            >
              {flag.severity}
            </span>
            {clickable ? (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowDownToLine size={11} /> show in source
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            {flag.explanation}
          </p>
          {flag.evidence ? (
            <pre className="mt-3 max-h-32 overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-lg bg-slate-950/70 p-3 font-mono text-[11px] leading-snug text-slate-300 ring-1 ring-inset ring-slate-800">
              {flag.evidence}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
