export function Logo({ className }: { className?: string }) {
  return (
    <div className={"flex items-center gap-2.5 " + (className ?? "")}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-400 shadow-[0_0_30px_-6px_rgba(56,189,248,0.55)]">
        <span
          aria-hidden
          className="absolute inset-0 opacity-60 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 55%)",
          }}
        />
        <svg
          viewBox="0 0 24 24"
          className="relative h-5 w-5 text-slate-950"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 2.5 4 5.5v6.4c0 4.6 3.3 8.9 8 9.6 4.7-.7 8-5 8-9.6V5.5l-8-3Z" />
          <path d="m9 12.2 2.2 2.2L15 10.7" />
        </svg>
      </span>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tracking-tight">Sentra</span>
          <span className="rounded bg-slate-100/[0.06] px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">
            AI
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
          Phishing Sentinel
        </div>
      </div>
    </div>
  );
}
