export function Logo({ className }: { className?: string }) {
  return (
    <div className={"flex items-center gap-2.5 " + (className ?? "")}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 shadow-[0_0_30px_rgba(56,189,248,0.45)]">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-slate-950"
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
        <div className="text-sm font-semibold tracking-tight">Sentra AI</div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
          Phishing Sentinel
        </div>
      </div>
    </div>
  );
}
