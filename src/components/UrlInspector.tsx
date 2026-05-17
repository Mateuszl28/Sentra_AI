"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Link2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  Severity,
  UrlInspectionResponse,
  UrlVerdict,
} from "@/lib/types";
import { RedFlagCard } from "./RedFlagCard";
import { RiskGauge } from "./RiskGauge";

const URL_EXAMPLES: {
  label: string;
  url: string;
  pattern: string;
  tone: "danger" | "warn" | "safe";
}[] = [
  {
    label: "PayPal lookalike",
    url: "https://paypa1-secure-help.com/login/verify?u=customer",
    pattern: "Lookalike domain + credential path",
    tone: "danger",
  },
  {
    label: "Punycode Apple",
    url: "https://xn--pple-43d.com/account/unlock",
    pattern: "Homoglyph (Punycode)",
    tone: "danger",
  },
  {
    label: "@-trick PayPal",
    url: "http://paypal.com@198.51.100.42/login",
    pattern: "@-trick credentials hiding real host",
    tone: "danger",
  },
  {
    label: "Suspicious .top",
    url: "https://microsoft365-support.top/quota/free-up?id=8421",
    pattern: "Brand spoof + high-abuse TLD",
    tone: "danger",
  },
  {
    label: "bit.ly shortener",
    url: "https://bit.ly/3xK4Q9z",
    pattern: "Shortener hides the real destination",
    tone: "warn",
  },
  {
    label: "Legit github.com",
    url: "https://github.com/settings/keys",
    pattern: "Verified brand, no red flags",
    tone: "safe",
  },
];

const URL_VERDICT_STYLES: Record<
  UrlVerdict,
  {
    label: string;
    ring: string;
    bg: string;
    text: string;
    Icon: typeof ShieldCheck;
  }
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
  MALICIOUS: {
    label: "Malicious",
    ring: "ring-rose-400/40",
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    Icon: ShieldX,
  },
};

const SEVERITY_PILL: Record<Severity, string> = {
  high: "bg-rose-500/20 text-rose-200",
  medium: "bg-amber-500/20 text-amber-200",
  low: "bg-sky-500/20 text-sky-200",
  info: "bg-slate-500/20 text-slate-200",
};

export function UrlInspector({
  onRecord,
  initialUrl,
}: {
  onRecord?: (entry: {
    kind: "url";
    label: string;
    verdict: UrlVerdict;
    riskScore: number;
    timestamp: number;
    payload: string;
  }) => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlInspectionResponse | null>(null);
  const didAutoRun = useRef(false);

  useEffect(() => {
    if (!initialUrl) return;
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    inspect(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  async function inspect(value?: string) {
    const target = (value ?? url).trim();
    if (!target) return;
    setLoading(true);
    setError(null);
    setResult(null);
    if (value) setUrl(value);
    try {
      const res = await fetch("/api/inspect-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      const typed = data as UrlInspectionResponse;
      setResult(typed);
      onRecord?.({
        kind: "url",
        label: typed.parts.hostname,
        verdict: typed.analysis.verdict,
        riskScore: typed.analysis.riskScore,
        timestamp: Date.now(),
        payload: target,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-1.5 shadow-[0_0_60px_-20px_rgba(56,189,248,0.15)]">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Link2 size={12} className="text-sky-300" />
            <span className="font-mono tracking-tight">
              paste a single URL or domain
            </span>
          </span>
          {url ? (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setResult(null);
                setError(null);
              }}
              className="rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
            >
              clear
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim() && !loading) inspect();
            }}
            spellCheck={false}
            placeholder="https://paypa1-secure-help.com/login/verify"
            className="block min-w-0 flex-1 rounded-2xl bg-slate-950/60 px-4 py-3 font-mono text-[13px] text-slate-200 placeholder:text-slate-600 outline-none ring-1 ring-inset ring-slate-800/80 focus:ring-sky-500/60"
          />
          <button
            type="button"
            disabled={!url.trim() || loading}
            onClick={() => inspect()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_8px_30px_-10px_rgba(56,189,248,0.6)] transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Inspecting…
              </>
            ) : (
              <>
                <Search size={15} strokeWidth={2.4} /> Inspect URL
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="self-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Try one:
        </span>
        {URL_EXAMPLES.map((ex) => {
          const accent =
            ex.tone === "danger"
              ? "bg-rose-500/20 text-rose-300"
              : ex.tone === "warn"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-emerald-500/20 text-emerald-300";
          const active = url === ex.url;
          return (
            <button
              key={ex.url}
              type="button"
              onClick={() => inspect(ex.url)}
              title={ex.pattern}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all ${
                active
                  ? "bg-sky-500/15 text-sky-200 ring-sky-400/40"
                  : "bg-slate-900/40 text-slate-300 ring-slate-700 hover:bg-slate-800/70 hover:text-slate-100"
              }`}
            >
              {ex.label}
              <span
                className={`ml-2 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider ${accent}`}
              >
                {ex.tone === "danger"
                  ? "BAD"
                  : ex.tone === "warn"
                    ? "WARN"
                    : "OK"}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <strong className="font-semibold">Inspection failed:</strong> {error}
        </div>
      ) : null}

      {loading && !result ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/30 px-4 py-6 text-sm text-slate-300">
          <Loader2 size={16} className="animate-spin text-sky-300" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-slate-400">
            Decomposing host, checking heuristics, asking Gemini…
          </span>
        </div>
      ) : null}

      {result ? <UrlResultView data={result} /> : null}
    </div>
  );
}

function UrlResultView({ data }: { data: UrlInspectionResponse }) {
  const { analysis, parts, heuristicFindings, meta } = data;
  const v = URL_VERDICT_STYLES[analysis.verdict];
  const VerdictIcon = v.Icon;
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <RiskGauge
              score={analysis.riskScore}
              verdict={
                analysis.verdict === "MALICIOUS"
                  ? "PHISHING"
                  : analysis.verdict === "SUSPICIOUS"
                    ? "SUSPICIOUS"
                    : "SAFE"
              }
            />
            <div className="space-y-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold ring-1 ring-inset ${v.ring} ${v.bg} ${v.text}`}
              >
                <VerdictIcon size={20} strokeWidth={2.4} />
                {v.label}
              </span>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300">
                {analysis.summary}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Sparkles size={11} /> {meta.model} · {meta.latencyMs} ms
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Stat label="Host" value={parts.hostname} mono />
          <Stat label="Registrable" value={parts.registrableDomain} mono />
          <Stat
            label="TLD"
            value={parts.tld ? `.${parts.tld}` : "—"}
            mono
          />
          <Stat
            label="Protocol"
            value={parts.protocol.toUpperCase()}
            mono
          />
        </div>

        {parts.unicodeHostname !== parts.hostname ? (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-200">
            <strong>Punycode decoded:</strong>{" "}
            <span className="font-mono">{parts.unicodeHostname}</span>
          </div>
        ) : null}
      </div>

      {analysis.redFlags.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">
              Red flags
            </h2>
            <span className="text-xs text-slate-500">
              {analysis.redFlags.length} found
            </span>
          </div>
          <div className="grid gap-3">
            {analysis.redFlags.map((flag, i) => (
              <RedFlagCard key={i} flag={flag} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {analysis.recommendedActions.length > 0 ? (
          <Panel
            title="What to do now"
            icon={<ArrowRight size={16} className="text-sky-400" />}
          >
            <ul className="space-y-2">
              {analysis.recommendedActions.map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-semibold text-sky-300">
                    {i + 1}
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {analysis.legitimateSignals.length > 0 ? (
          <Panel
            title="Signals in favor of legitimacy"
            icon={<CheckCircle2 size={16} className="text-emerald-400" />}
          >
            <ul className="space-y-2">
              {analysis.legitimateSignals.map((sig, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <CheckCircle2
                    size={14}
                    className="mt-1 shrink-0 text-emerald-400"
                  />
                  <span>{sig}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>

      <Panel
        title="Educational takeaway"
        icon={<GraduationCap size={16} className="text-cyan-400" />}
      >
        <p className="text-sm leading-relaxed text-slate-200">
          {analysis.educationalTakeaway}
        </p>
      </Panel>

      <details className="group rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Link2 size={14} /> Structural heuristics ({heuristicFindings.length})
          </span>
          <ChevronDown
            size={14}
            className="transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="mt-4 grid gap-2 text-xs">
          {heuristicFindings.length === 0 ? (
            <span className="text-slate-500">
              No structural checks triggered.
            </span>
          ) : (
            heuristicFindings.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono uppercase tracking-wider ${
                      SEVERITY_PILL[f.severity]
                    }`}
                  >
                    {f.severity}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {f.title}
                  </span>
                </div>
                <p className="mt-1.5 text-slate-400">{f.detail}</p>
                {f.evidence ? (
                  <pre className="mt-1.5 max-h-24 overflow-auto scrollbar-thin whitespace-pre-wrap rounded bg-slate-900/80 p-2 font-mono text-[10px] text-slate-400">
                    {f.evidence}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 truncate text-sm text-slate-200 ${
          mono ? "font-mono" : ""
        }`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}
