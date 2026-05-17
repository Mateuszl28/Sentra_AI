"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Parsing MIME structure…",
  "Inspecting SPF / DKIM / DMARC…",
  "Resolving sender reputation…",
  "Walking the Received chain…",
  "Decomposing links and attachments…",
  "Asking Gemini for the verdict…",
];

export function ResultSkeleton() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 750);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="grid gap-6 animate-fade-up">
      <div className="surface-elev relative overflow-hidden p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(56,189,248,0.5), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            {/* gauge skeleton */}
            <div className="relative h-[140px] w-[140px] shrink-0">
              <div className="absolute inset-0 rounded-full bg-slate-100/[0.03]" />
              <div
                className="absolute inset-3 rounded-full"
                style={{
                  background:
                    "conic-gradient(rgba(56,189,248,0.35) 0%, rgba(56,189,248,0.05) 60%, transparent 100%)",
                  animation: "spin 1.6s linear infinite",
                }}
              />
              <div className="absolute inset-5 rounded-full bg-[#0a1024]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shimmer className="h-7 w-12 rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              <Shimmer className="h-7 w-32 rounded-full" />
              <div className="space-y-2">
                <Shimmer className="h-3 w-[28rem] max-w-full rounded" />
                <Shimmer className="h-3 w-[22rem] max-w-full rounded" />
                <Shimmer className="h-3 w-[18rem] max-w-full rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface-flat p-3">
              <Shimmer className="h-2 w-16 rounded" />
              <Shimmer className="mt-2 h-3 w-full rounded" />
            </div>
          ))}
        </div>

        <div className="relative mt-6 flex items-center justify-center gap-3 text-xs text-muted">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/80" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
          </span>
          <span className="font-mono uppercase tracking-[0.18em]">
            {STAGES[stage]}
          </span>
        </div>
      </div>

      {/* Red flag placeholders */}
      <div className="grid gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface relative overflow-hidden p-5">
            <div
              className="absolute left-0 top-0 h-full w-1"
              style={{
                background:
                  i === 0
                    ? "rgba(244,63,94,0.6)"
                    : i === 1
                      ? "rgba(251,191,36,0.6)"
                      : "rgba(56,189,248,0.55)",
              }}
            />
            <div className="flex items-start gap-3">
              <Shimmer className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Shimmer className="h-3.5 w-3/5 rounded" />
                <Shimmer className="h-3 w-full rounded" />
                <Shimmer className="h-3 w-4/5 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-100/[0.05] ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.18) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}
