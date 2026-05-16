import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { LlmRedFlag } from "@/lib/types";

const SEVERITY_STYLES = {
  high: {
    ring: "ring-rose-500/30",
    pill: "bg-rose-500/20 text-rose-200",
    bar: "bg-rose-400",
    Icon: AlertTriangle,
  },
  medium: {
    ring: "ring-amber-500/30",
    pill: "bg-amber-500/20 text-amber-200",
    bar: "bg-amber-400",
    Icon: AlertCircle,
  },
  low: {
    ring: "ring-sky-500/30",
    pill: "bg-sky-500/20 text-sky-200",
    bar: "bg-sky-400",
    Icon: Info,
  },
  info: {
    ring: "ring-slate-500/30",
    pill: "bg-slate-500/20 text-slate-200",
    bar: "bg-slate-400",
    Icon: Info,
  },
} as const;

export function RedFlagCard({
  flag,
  index,
}: {
  flag: LlmRedFlag;
  index: number;
}) {
  const s = SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.medium;
  const Icon = s.Icon;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/60 ring-1 ring-inset ${s.ring} p-5`}
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
            <span className="text-xs uppercase tracking-widest text-slate-400">
              #{index + 1}
            </span>
            <h3 className="text-base font-semibold text-slate-100">
              {flag.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.pill}`}
            >
              {flag.severity}
            </span>
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
