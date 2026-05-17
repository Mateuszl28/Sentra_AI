import type { Verdict } from "@/lib/types";

export function RiskGauge({
  score,
  verdict,
  size = 140,
}: {
  score: number;
  verdict: Verdict;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = Math.max(8, Math.round(size * 0.082));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const colorStart =
    verdict === "PHISHING"
      ? "#fb7185"
      : verdict === "SUSPICIOUS"
        ? "#fbbf24"
        : "#34d399";
  const colorEnd =
    verdict === "PHISHING"
      ? "#f43f5e"
      : verdict === "SUSPICIOUS"
        ? "#f59e0b"
        : "#22d3ee";

  const gradId = `risk-grad-${verdict}-${size}`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-2 rounded-full opacity-40 blur-xl"
        style={{
          background: `radial-gradient(circle, ${colorStart}40, transparent 70%)`,
        }}
      />
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148,163,184,0.14)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="text-[2.05rem] font-semibold tabular-nums leading-none"
          style={{ color: colorStart }}
        >
          {clamped}
        </div>
        <div className="mt-1 text-[9px] font-mono uppercase tracking-[0.18em] text-muted">
          Risk score
        </div>
      </div>
    </div>
  );
}
