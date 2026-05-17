"use client";

import { ArrowLeft, RefreshCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.error("[Sentra:GlobalError]", error);
    }
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center gap-4 animate-fade-up">
        <Logo />
        <div className="kicker mt-2">
          <ShieldAlert size={11} /> Something broke · we caught it
        </div>
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
          Sentra stumbled,{" "}
          <span className="bg-gradient-to-r from-rose-300 via-amber-200 to-sky-200 bg-clip-text text-transparent">
            but nothing leaked.
          </span>
        </h1>
        <p className="max-w-md text-balance text-sm leading-relaxed text-muted">
          A component threw an unhandled error. Your pasted email and history
          stayed local — nothing was sent anywhere on this failure.
        </p>
        {error?.digest ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            digest · {error.digest}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="btn-primary"
        >
          <RefreshCcw size={14} />
          Try again
        </button>
        <Link
          href="/"
          className="btn-ghost"
        >
          <ArrowLeft size={13} />
          Back to workbench
        </Link>
      </div>

      <details className="w-full max-w-md surface p-4 text-left">
        <summary className="cursor-pointer text-xs font-medium text-muted hover:text-slate-200">
          Error details
        </summary>
        <pre className="mt-2 max-h-40 overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-md bg-slate-950/60 p-3 font-mono text-[10.5px] text-slate-300">
          {error?.name ? `${error.name}: ` : ""}{error?.message ?? "Unknown error"}
        </pre>
      </details>
    </main>
  );
}
