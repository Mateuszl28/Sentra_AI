"use client";

import {
  ArrowDown,
  Github,
  Globe,
  GraduationCap,
  Inbox,
  Link2,
  Loader2,
  ScanSearch,
  ShieldAlert,
  History as HistoryIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmailInput } from "@/components/EmailInput";
import { HistoryPanel } from "@/components/HistoryPanel";
import { InboxSimulator } from "@/components/InboxSimulator";
import { Logo } from "@/components/Logo";
import { ResultView } from "@/components/ResultView";
import { TrainMode } from "@/components/TrainMode";
import { UrlInspector } from "@/components/UrlInspector";
import type { AnalysisResponse } from "@/lib/types";
import { useHistory } from "@/lib/useHistory";

const LOADING_STAGES = [
  "Parsing MIME structure…",
  "Inspecting SPF / DKIM / DMARC…",
  "Resolving sender reputation…",
  "Decomposing links and attachments…",
  "Asking Gemini for the verdict…",
];

type Mode = "analyze" | "url" | "train" | "inbox";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("analyze");
  const [raw, setRaw] = useState("");
  const [urlSeed, setUrlSeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [stage, setStage] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const history = useHistory();

  useEffect(() => {
    if (!loading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStage(0);
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

  const stats = useMemo(() => {
    const total = history.entries.length;
    const phishy = history.entries.filter(
      (e) => e.verdict === "PHISHING" || e.verdict === "MALICIOUS",
    ).length;
    return { total, phishy };
  }, [history.entries]);

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
      const typed = data as AnalysisResponse;
      setResult(typed);
      history.record({
        kind: "email",
        label:
          typed.parsed.subject ||
          typed.parsed.fromAddress ||
          "(no subject)",
        verdict: typed.analysis.verdict,
        riskScore: typed.analysis.riskScore,
        timestamp: Date.now(),
        payload: raw,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  function sendToAnalyzer(rawEmail: string) {
    setRaw(rawEmail);
    setMode("analyze");
    setResult(null);
    setError(null);
    requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openHistoryUrl(url: string) {
    setUrlSeed(url);
    setMode("url");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-24 pt-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <div className="order-3 flex items-center gap-1 rounded-full bg-slate-900/60 p-1 ring-1 ring-inset ring-slate-800 sm:order-2">
          <ModeButton
            active={mode === "analyze"}
            onClick={() => setMode("analyze")}
            icon={<ScanSearch size={13} />}
            label="Analyzer"
          />
          <ModeButton
            active={mode === "url"}
            onClick={() => setMode("url")}
            icon={<Link2 size={13} />}
            label="URL"
          />
          <ModeButton
            active={mode === "train"}
            onClick={() => setMode("train")}
            icon={<GraduationCap size={13} />}
            label="Train"
          />
          <ModeButton
            active={mode === "inbox"}
            onClick={() => setMode("inbox")}
            icon={<Inbox size={13} />}
            label="Inbox"
          />
        </div>
        <div className="order-2 flex items-center gap-2 text-xs text-slate-400 sm:order-3">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            title="Session history (last 25 analyses)"
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1.5 ring-1 ring-inset ring-slate-700 transition hover:text-slate-100"
          >
            <HistoryIcon size={12} />
            <span className="tabular-nums">{stats.total}</span>
            {stats.phishy > 0 ? (
              <span className="ml-1 rounded-full bg-rose-500/20 px-1.5 py-px text-[9px] font-semibold text-rose-300">
                {stats.phishy} ⚠
              </span>
            ) : null}
          </button>
          <a
            href="https://hack-the-tech.devpost.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full bg-slate-900/60 px-3 py-1.5 ring-1 ring-inset ring-slate-700 transition hover:text-slate-100 md:inline-flex"
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

      {mode === "analyze" ? (
        <>
          <section className="mt-16 grid gap-6 text-center sm:mt-24">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-300 ring-1 ring-inset ring-rose-500/30">
              <ShieldAlert size={12} /> 90% of breaches start with a phishing
              email
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
              <strong className="text-slate-100">Gemini 2.5 Flash</strong> for a
              human-readable verdict — in seconds.
            </p>
          </section>

          <section ref={inputRef} className="mt-12 grid gap-4 scroll-mt-6">
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
                <strong className="font-semibold">Analysis failed:</strong>{" "}
                {error}
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
        </>
      ) : null}

      {mode === "url" ? (
        <>
          <section className="mt-12 grid gap-4 text-center sm:mt-16">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-300 ring-1 ring-inset ring-sky-500/30">
              <Link2 size={12} /> URL inspector
            </div>
            <h1 className="mx-auto max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
              Hovered over a link and unsure?{" "}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                Drop the URL here first.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-sm leading-relaxed text-slate-300 sm:text-base">
              Sentra decomposes the URL — Punycode, lookalike domains, raw IPs,
              shorteners, suspicious TLDs, @-tricks — without ever fetching it.
              Gemini explains what it sees, no visit required.
            </p>
          </section>
          <section className="mt-10">
            <UrlInspector
              key={urlSeed ?? "fresh"}
              onRecord={history.record}
              {...(urlSeed ? { initialUrl: urlSeed } : {})}
            />
          </section>
        </>
      ) : null}

      {mode === "train" ? (
        <>
          <section className="mt-12 grid gap-4 text-center sm:mt-16">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-inset ring-cyan-500/30">
              <GraduationCap size={12} /> Train your eye
            </div>
            <h1 className="mx-auto max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
              Ten emails. Three guesses each.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-200 bg-clip-text text-transparent">
                How sharp is your inbox sense?
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-sm leading-relaxed text-slate-300 sm:text-base">
              No AI yet — just you and the raw email. After each guess, see the
              answer and (if you want) the full Sentra analysis.
            </p>
          </section>
          <section className="mt-10">
            <TrainMode onSendToAnalyzer={sendToAnalyzer} />
          </section>
        </>
      ) : null}

      {mode === "inbox" ? (
        <>
          <section className="mt-12 grid gap-4 text-center sm:mt-16">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
              <Inbox size={12} /> Inbox simulator
            </div>
            <h1 className="mx-auto max-w-3xl text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
              A real-feeling inbox.{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-sky-200 to-cyan-200 bg-clip-text text-transparent">
                Triage like Monday morning.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-sm leading-relaxed text-slate-300 sm:text-base">
              Click any message. Decide before you open: report, trash, or keep.
              Sentra grades you and shows what you missed.
            </p>
          </section>
          <section className="mt-10">
            <InboxSimulator onSendToAnalyzer={sendToAnalyzer} />
          </section>
        </>
      ) : null}

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
          probabilistic, not a replacement for your email provider&apos;s filters.
        </p>
      </footer>

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={history.entries}
        onOpenEmail={sendToAnalyzer}
        onOpenUrl={openHistoryUrl}
        onClear={history.clear}
        onRemove={history.remove}
      />
    </main>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 shadow"
          : "text-slate-300 hover:text-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
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
    body: "Gemini 2.5 Flash sees raw email + heuristic findings, then explains what's wrong in plain English — and what's not.",
  },
  {
    kicker: "Layer 3",
    title: "Learn, don't just trust",
    body: "Every verdict ships with an educational takeaway so next time you spot the pattern without our help.",
  },
];
