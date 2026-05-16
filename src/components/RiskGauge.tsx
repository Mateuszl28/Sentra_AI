import type { Verdict } from "@/lib/types";

export function RiskGauge({
  score,
  verdict,
}: {
  score: number;
  verdict: Verdict;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 56;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    verdict === "PHISHING"
      ? "#fb7185"
      : verdict === "SUSPICIOUS"
        ? "#fbbf24"
        : "#34d399";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={140} height={140} className="-rotate-90">
        <circle
          cx={70}
          cy={70}
          r={radius}
          stroke="rgba(148,163,184,0.18)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={70}
          cy={70}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold tabular-nums" style={{ color }}>
          {clamped}
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Risk score
        </div>
      </div>
    </div>
  );
}
