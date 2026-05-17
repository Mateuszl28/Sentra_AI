"use client";

import { ArrowDown, Github, Globe, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmailInput } from "@/components/EmailInput";
import { Logo } from "@/components/Logo";
import { ResultView } from "@/components/ResultView";
import type { AnalysisResponse } from "@/lib/types";

const LOADING_STAGES = [
  "Parsing MIME structure…",
  "Inspecting SPF / DKIM / DMARC…",
  "Resolving sender reputation…",
  "Decomposing links and attachments…",
  "Asking Gemini for the verdict…",
];

export default function HomePage() {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [stage, setStage] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) {
      setStage(0);
      return;
    }
    const id = window.setInterval(() => {
      setStage((s) => (s + 1) % LOADING_STAGES.length);
    }, 800);
    return () => window.clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setResult(data as AnalysisResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-24 pt-6 sm:px-8">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <a
            href="https://hack-the-tech.devpost.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1.5 ring-1 ring-inset ring-slate-700 transition hover:text-slate-100 sm:inline-flex"
          >
            <Globe size={12} /> Hack the Tech 2026
          </a>
          <a
            href="https://github.com/Mateuszl28/Sentra_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1.5 ring-1 ring-inset ring-slate-700 transition hover:text-slate-100"
          >
            <Github size={12} /> Source
          </a>
        </div>
      </header>

      <section className="mt-16 grid gap-6 text-center sm:mt-24">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-300 ring-1 ring-inset ring-rose-500/30">
          <ShieldAlert size={12} /> 90% of breaches start with a phishing email
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          Stop guessing if an email is real.{" "}
          <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
            Sentra reads it for you.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg">
          Paste a suspicious email below. Sentra runs deterministic header,
          sender, link and content checks, then hands the evidence to{" "}
          <strong className="text-slate-100">Gemini 2.0 Flash</strong> for a
          human-readable verdict — in seconds.
        </p>
      </section>

      <section className="mt-12 grid gap-4">
        <EmailInput
          value={raw}
          setValue={setRaw}
          loading={loading}
          onAnalyze={analyze}
          onReset={() => {
            setResult(null);
            setError(null);
          }}
        />
        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <strong className="font-semibold">Analysis failed:</strong> {error}
          </div>
        ) : null}
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/30 px-4 py-6 text-sm text-slate-300">
            <Loader2 size={16} className="animate-spin text-sky-300" />
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">
              {LOADING_STAGES[stage]}
            </span>
          </div>
        ) : null}
      </section>

      <div ref={resultRef} className="mt-12 scroll-mt-6">
        {result ? (
          <ResultView data={result} rawEmail={raw} />
        ) : !loading && !error ? (
          <section className="mt-4 grid gap-3 text-center">
            <div className="mx-auto inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-slate-500">
              <ArrowDown size={11} /> Or pick an example above
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 text-left"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-sky-300">
                    {f.kicker}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-slate-100">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <footer className="mt-auto pt-24 text-center text-[11px] text-slate-500">
        <p>
          Built solo for{" "}
          <a
            className="text-slate-300 hover:text-slate-100"
            href="https://hack-the-tech.devpost.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hack the Tech 2026
          </a>
          {" · "}
          Cybersecurity & Privacy track. Educational tool — verdicts are
          probabilistic, not a replacement for your email provider's filters.
        </p>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    kicker: "Layer 1",
    title: "Deterministic heuristics",
    body: "Pure-TS analyzer: SPF/DKIM/DMARC, lookalike domains, anchor↔href mismatch, suspicious TLDs, urgency & threat language.",
  },
  {
    kicker: "Layer 2",
    title: "LLM as analyst",
    body: "Gemini 2.0 Flash sees raw email + heuristic findings, then explains what's wrong in plain English — and what's not.",
  },
  {
    kicker: "Layer 3",
    title: "Learn, don't just trust",
    body: "Every verdict ships with an educational takeaway so next time you spot the pattern without our help.",
  },
];
