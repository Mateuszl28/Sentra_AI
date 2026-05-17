import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import type { Verdict } from "@/lib/types";

const STYLES: Record<
  Verdict,
  {
    label: string;
    ring: string;
    bg: string;
    text: string;
    dot: string;
    Icon: typeof ShieldCheck;
  }
> = {
  SAFE: {
    label: "Safe",
    ring: "ring-emerald-400/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    Icon: ShieldCheck,
  },
  SUSPICIOUS: {
    label: "Suspicious",
    ring: "ring-amber-400/40",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    dot: "bg-amber-400",
    Icon: ShieldAlert,
  },
  PHISHING: {
    label: "Phishing",
    ring: "ring-rose-400/40",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    dot: "bg-rose-400",
    Icon: ShieldX,
  },
};

export function VerdictBadge({
  verdict,
  size = "md",
}: {
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
}) {
  const s = STYLES[verdict];
  const Icon = s.Icon;
  const sizing =
    size === "lg"
      ? "text-sm px-3.5 py-1.5 gap-2"
      : size === "sm"
        ? "text-[11px] px-2.5 py-1 gap-1.5"
        : "text-xs px-3 py-1.5 gap-2";
  const iconSize = size === "lg" ? 16 : size === "sm" ? 11 : 13;
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ring-1 ring-inset ${s.ring} ${s.bg} ${s.text} ${sizing}`}
    >
      <span className="relative inline-flex h-1.5 w-1.5">
        <span
          className={`absolute inset-0 animate-ping rounded-full ${s.dot} opacity-70`}
        />
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`}
        />
      </span>
      <Icon size={iconSize} strokeWidth={2.4} />
      {s.label}
    </span>
  );
}
