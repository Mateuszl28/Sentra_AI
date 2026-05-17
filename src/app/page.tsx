"use client";

import {
  ArrowDown,
  BarChart3,
  BookOpen,
  GraduationCap,
  Inbox,
  Link2,
  ShieldAlert,
  Share2,
  SplitSquareHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Anatomy } from "@/components/Anatomy";
import { CommandPalette } from "@/components/CommandPalette";
import { CompareMode } from "@/components/CompareMode";
import { EmailInput } from "@/components/EmailInput";
import { HistoryPanel } from "@/components/HistoryPanel";
import { InboxSimulator } from "@/components/InboxSimulator";
import { Insights } from "@/components/Insights";
import { ResultSkeleton } from "@/components/ResultSkeleton";
import { ResultView } from "@/components/ResultView";
import { ShortcutsPanel } from "@/components/ShortcutsPanel";
import { MobileTabStrip, Sidebar, type Mode } from "@/components/Sidebar";
import { useToast } from "@/components/Toast";
import { Topbar } from "@/components/Topbar";
import { TrainMode } from "@/components/TrainMode";
import { UrlInspector } from "@/components/UrlInspector";
import { clearShareFromHash, readShareFromHash } from "@/lib/share";
import type { AnalysisResponse } from "@/lib/types";
import { useHistory } from "@/lib/useHistory";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("analyze");
  const [raw, setRaw] = useState("");
  const [urlSeed, setUrlSeed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shareBanner, setShareBanner] = useState<{ sharedAt: number } | null>(
    null,
  );
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const history = useHistory();
  const toast = useToast();

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => {
    const shared = readShareFromHash();
    if (shared) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setMode("analyze");
      setRaw(shared.rawEmail);
      setResult(shared.data);
      setShareBanner({ sharedAt: shared.sharedAt });
      /* eslint-enable react-hooks/set-state-in-effect */
      clearShareFromHash();
      return;
    }
    // Bookmarklet pre-fill: /?prefill=<base64url(raw text)>
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("prefill");
    if (!prefill) return;
    try {
      const b64 = prefill.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "===".slice(0, (4 - (b64.length % 4)) % 4);
      const decoded = decodeURIComponent(escape(atob(padded)));
      if (decoded.length > 50) {
        setMode("analyze");
        setRaw(decoded);
      }
    } catch {
      /* malformed prefill — ignore */
    } finally {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, "", cleanUrl);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key !== "?") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setShortcutsOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("sentra:welcomed");
    if (seen) return;
    const timer = window.setTimeout(() => {
      toast.push({
        tone: "info",
        title: "Tip: press ⌘K (or Ctrl+K) anywhere",
        body: "Quick-switch between modes or jump back into any past analysis.",
      });
      window.localStorage.setItem("sentra:welcomed", "1");
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const total = history.entries.length;
    const phishy = history.entries.filter(
      (e) => e.verdict === "PHISHING" || e.verdict === "MALICIOUS",
    ).length;
    const safe = history.entries.filter((e) => e.verdict === "SAFE").length;
    return { total, phishy, safe };
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
          typed.parsed.subject || typed.parsed.fromAddress || "(no subject)",
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
    <div className="flex min-h-screen w-full">
      <Sidebar
        mode={mode}
        onChange={setMode}
        onOpenCommandPalette={() => setPaletteOpen(true)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          mode={mode}
          historyTotal={stats.total}
          phishyTotal={stats.phishy}
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-6 sm:px-8">
          <MobileTabStrip mode={mode} onChange={setMode} />

          {shareBanner ? (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100 animate-fade-up">
              <span className="inline-flex items-center gap-2">
                <Share2 size={14} className="text-sky-300" />
                <span>
                  Viewing a shared verdict from{" "}
                  {new Date(shareBanner.sharedAt).toLocaleString()}.
                </span>
              </span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setShareBanner(null)}
                className="rounded-md p-1 text-sky-200 hover:bg-sky-500/10"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}

          {mode === "analyze" ? (
            <>
              <Hero
                accent="sky"
                kicker={
                  <>
                    <ShieldAlert size={11} /> 90% of breaches start with a
                    phishing email
                  </>
                }
                title="Stop guessing if an email is real."
                accentSpan="Sentra reads it for you."
                description={
                  <>
                    Paste a suspicious email below. Sentra runs deterministic
                    header, sender, link and content checks, then hands the
                    evidence to{" "}
                    <strong className="text-slate-100">
                      Gemini 2.5 Flash
                    </strong>{" "}
                    for a human-readable verdict — in seconds.
                  </>
                }
              />

              <KpiStrip
                items={[
                  { label: "Analyses", value: stats.total },
                  {
                    label: "Phishy caught",
                    value: stats.phishy,
                    tone: "rose",
                  },
                  { label: "Safe baselines", value: stats.safe, tone: "emerald" },
                  {
                    label: "Heuristic checks",
                    value: "30+",
                    tone: "sky",
                    sub: "pure-TS",
                  },
                ]}
              />

              <section
                ref={inputRef}
                className="mt-10 grid gap-4 scroll-mt-6 animate-fade-up"
              >
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
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 animate-fade-up">
                    <strong className="font-semibold">Analysis failed:</strong>{" "}
                    {error}
                  </div>
                ) : null}
              </section>

              <div ref={resultRef} className="mt-10 scroll-mt-6">
                {loading ? (
                  <ResultSkeleton />
                ) : result ? (
                  <div className="animate-fade-up">
                    <ResultView data={result} rawEmail={raw} />
                  </div>
                ) : !error ? (
                  <FeatureGrid />
                ) : null}
              </div>
            </>
          ) : null}

          {mode === "url" ? (
            <>
              <Hero
                accent="sky"
                kicker={
                  <>
                    <Link2 size={11} /> URL inspector
                  </>
                }
                title="Hovered over a link and unsure?"
                accentSpan="Drop the URL here first."
                description="Sentra decomposes the URL — Punycode, lookalike domains, raw IPs, shorteners, suspicious TLDs, @-tricks — without ever fetching it. Gemini explains what it sees, no visit required."
              />
              <section className="mt-10 animate-fade-up">
                <UrlInspector
                  key={urlSeed ?? "fresh"}
                  onRecord={history.record}
                  {...(urlSeed ? { initialUrl: urlSeed } : {})}
                />
              </section>
            </>
          ) : null}

          {mode === "compare" ? (
            <>
              <Hero
                accent="fuchsia"
                kicker={
                  <>
                    <SplitSquareHorizontal size={11} /> Compare
                  </>
                }
                title="Two emails, side by side."
                accentSpan="Spot the difference."
                description="Paste the suspect on one side, the legit baseline on the other. Sentra analyzes both and shows where they diverge."
              />
              <section className="mt-10 animate-fade-up">
                <CompareMode />
              </section>
            </>
          ) : null}

          {mode === "train" ? (
            <>
              <Hero
                accent="cyan"
                kicker={
                  <>
                    <GraduationCap size={11} /> Train your eye
                  </>
                }
                title="Ten emails. Three guesses each."
                accentSpan="How sharp is your inbox sense?"
                description="No AI yet — just you and the raw email. After each guess, see the answer and (if you want) the full Sentra analysis."
              />
              <section className="mt-10 animate-fade-up">
                <TrainMode onSendToAnalyzer={sendToAnalyzer} />
              </section>
            </>
          ) : null}

          {mode === "inbox" ? (
            <>
              <Hero
                accent="emerald"
                kicker={
                  <>
                    <Inbox size={11} /> Inbox simulator
                  </>
                }
                title="A real-feeling inbox."
                accentSpan="Triage like Monday morning."
                description="Click any message. Decide before you open: report, trash, or keep. Sentra grades you and shows what you missed."
              />
              <section className="mt-10 animate-fade-up">
                <InboxSimulator onSendToAnalyzer={sendToAnalyzer} />
              </section>
            </>
          ) : null}

          {mode === "anatomy" ? (
            <>
              <Hero
                accent="amber"
                kicker={
                  <>
                    <BookOpen size={11} /> Anatomy of a phishing email
                  </>
                }
                title="One email, eight tricks."
                accentSpan="Watch them light up."
                description="A guided walkthrough of a real-looking PayPal phish. Step through each red flag — header by header, link by link."
              />
              <section className="mt-10 animate-fade-up">
                <Anatomy onSendToAnalyzer={sendToAnalyzer} />
              </section>
            </>
          ) : null}

          {mode === "insights" ? (
            <>
              <Hero
                accent="indigo"
                kicker={
                  <>
                    <BarChart3 size={11} /> Insights
                  </>
                }
                title="Your session, charted."
                accentSpan="What you saw, what slipped."
                description="All charts come from your local history. Nothing leaves this browser."
              />
              <section className="mt-10 animate-fade-up">
                <Insights
                  entries={history.entries}
                  onOpenEmail={sendToAnalyzer}
                  onOpenUrl={openHistoryUrl}
                />
              </section>
            </>
          ) : null}

          <footer className="mt-24 border-t hairline pt-6 text-center text-[11px] text-muted">
            Built solo for{" "}
            <a
              className="text-slate-300 hover:text-slate-100"
              href="https://hack-the-tech.devpost.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hack the Tech 2026
            </a>
            {" · "}Cybersecurity &amp; Privacy track. Educational tool — verdicts
            are probabilistic, not a replacement for your email provider&apos;s
            filters.
          </footer>
        </main>
      </div>

      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={history.entries}
        onOpenEmail={sendToAnalyzer}
        onOpenUrl={openHistoryUrl}
        onClear={history.clear}
        onRemove={history.remove}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        mode={mode}
        onModeChange={setMode}
        history={history.entries}
        onOpenEmail={sendToAnalyzer}
        onOpenUrl={openHistoryUrl}
      />

      <ShortcutsPanel
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

const ACCENT_GRADIENT: Record<string, string> = {
  sky: "from-sky-300 via-cyan-200 to-emerald-200",
  cyan: "from-cyan-300 via-sky-200 to-emerald-200",
  fuchsia: "from-fuchsia-300 via-sky-200 to-cyan-200",
  emerald: "from-emerald-300 via-sky-200 to-cyan-200",
  amber: "from-amber-300 via-rose-200 to-fuchsia-200",
  indigo: "from-indigo-300 via-sky-200 to-cyan-200",
};

const ACCENT_RING: Record<string, string> = {
  sky: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  cyan: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/30",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  indigo: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/30",
};

function Hero({
  accent,
  kicker,
  title,
  accentSpan,
  description,
}: {
  accent: keyof typeof ACCENT_GRADIENT;
  kicker: React.ReactNode;
  title: string;
  accentSpan: string;
  description: React.ReactNode;
}) {
  return (
    <section className="relative mt-10 grid gap-5 text-center sm:mt-14 animate-fade-up">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 -z-10 mx-auto h-40 max-w-3xl opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(56,189,248,0.25), transparent 70%)",
        }}
      />
      <div
        className={`mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ring-1 ring-inset ${ACCENT_RING[accent]}`}
      >
        {kicker}
      </div>
      <h1 className="mx-auto max-w-3xl text-balance text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl">
        {title}{" "}
        <span
          className={`bg-gradient-to-r ${ACCENT_GRADIENT[accent]} bg-clip-text text-transparent`}
        >
          {accentSpan}
        </span>
      </h1>
      <p className="mx-auto max-w-2xl text-balance text-[15px] leading-relaxed text-slate-300 sm:text-base">
        {description}
      </p>
    </section>
  );
}

function KpiStrip({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    sub?: string;
    tone?: "sky" | "rose" | "emerald" | "amber";
  }[];
}) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => {
        const tone =
          it.tone === "rose"
            ? "text-rose-300"
            : it.tone === "emerald"
              ? "text-emerald-300"
              : it.tone === "amber"
                ? "text-amber-300"
                : "text-sky-300";
        return (
          <div
            key={it.label}
            className="surface px-4 py-3 transition hover:bg-slate-100/[0.02]"
          >
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
              {it.label}
            </div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>
              {it.value}
            </div>
            {it.sub ? (
              <div className="mt-0.5 text-[10px] text-muted">{it.sub}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FeatureGrid() {
  return (
    <section className="mt-6 grid gap-3 text-center">
      <div className="mx-auto inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted">
        <ArrowDown size={11} /> Or pick an example above
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="surface group p-5 text-left transition hover:bg-slate-100/[0.025]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-sky-300">
              <Sparkles size={11} /> {f.kicker}
            </div>
            <h3 className="mt-2 text-sm font-semibold text-slate-100">
              {f.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
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
    body: "Every verdict ships with a follow-up chat and an educational takeaway so next time you spot the pattern without our help.",
  },
];
