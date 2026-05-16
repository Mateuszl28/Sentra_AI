import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { Verdict } from "@/lib/types";

const STYLES: Record<
  Verdict,
  { label: string; ring: string; bg: string; text: string; Icon: typeof ShieldCheck }
> = {
  SAFE: {
    label: "Looks safe",
    ring: "ring-emerald-400/40",
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    Icon: ShieldCheck,
  },
  SUSPICIOUS: {
    label: "Suspicious",
    ring: "ring-amber-400/40",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    Icon: ShieldAlert,
  },
  PHISHING: {
    label: "Phishing",
    ring: "ring-rose-400/40",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
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
      ? "text-base px-4 py-2 gap-2.5"
      : size === "sm"
        ? "text-xs px-2.5 py-1 gap-1.5"
        : "text-sm px-3 py-1.5 gap-2";
  const iconSize = size === "lg" ? 20 : size === "sm" ? 12 : 16;
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset ${s.ring} ${s.bg} ${s.text} ${sizing}`}
    >
      <Icon size={iconSize} strokeWidth={2.4} />
      {s.label}
    </span>
  );
}
