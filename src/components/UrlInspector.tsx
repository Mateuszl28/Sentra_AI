"use client";

import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Globe2,
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
  DomainInfoSummary,
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
      <div className="surface-elev p-1.5">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-2">
            <Link2 size={12} className="text-sky-300" />
            <span className="font-mono uppercase tracking-[0.18em]">
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
              className="rounded-md px-1.5 py-0.5 text-[11px] text-muted transition hover:bg-slate-800/70 hover:text-slate-200"
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
            className="block min-w-0 flex-1 rounded-xl bg-[rgba(2,6,23,0.55)] px-4 py-3 font-mono text-[13px] text-slate-200 placeholder:text-slate-600 outline-none ring-1 ring-inset ring-[var(--border)] transition focus:ring-sky-500/60"
          />
          <button
            type="button"
            disabled={!url.trim() || loading}
            onClick={() => inspect()}
            className="btn-primary shrink-0 px-5 py-3"
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

      <div className="flex flex-wrap gap-1.5">
        <span className="kicker self-center mr-1">samples</span>
        {URL_EXAMPLES.map((ex) => {
          const dot =
            ex.tone === "danger"
              ? "bg-rose-400"
              : ex.tone === "warn"
                ? "bg-amber-400"
                : "bg-emerald-400";
          const active = url === ex.url;
          return (
            <button
              key={ex.url}
              type="button"
              onClick={() => inspect(ex.url)}
              title={ex.pattern}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset transition ${
                active
                  ? "bg-sky-500/15 text-sky-200 ring-sky-400/40"
                  : "border hairline bg-slate-900/40 text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
              }`}
            >
              <span className={`h-1 w-1 rounded-full ${dot}`} />
              {ex.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 animate-fade-up">
          <strong className="font-semibold">Inspection failed:</strong> {error}
        </div>
      ) : null}

      {loading && !result ? (
        <div className="surface flex items-center justify-center gap-3 px-4 py-6 text-sm text-slate-300 animate-fade-in">
          <Loader2 size={16} className="animate-spin text-sky-300" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Decomposing host, checking heuristics, asking Gemini…
          </span>
        </div>
      ) : null}

      {result ? (
        <div className="animate-fade-up">
          <UrlResultView data={result} />
        </div>
      ) : null}
    </div>
  );
}

function UrlResultView({ data }: { data: UrlInspectionResponse }) {
  const { analysis, parts, heuristicFindings, meta } = data;
  const v = URL_VERDICT_STYLES[analysis.verdict];
  const VerdictIcon = v.Icon;
  return (
    <div className="grid gap-6">
      <div className="surface-elev relative overflow-hidden p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              analysis.verdict === "MALICIOUS"
                ? "radial-gradient(circle, rgba(244,63,94,0.6), transparent 60%)"
                : analysis.verdict === "SUSPICIOUS"
                  ? "radial-gradient(circle, rgba(251,191,36,0.5), transparent 60%)"
                  : "radial-gradient(circle, rgba(52,211,153,0.5), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
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
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider ring-1 ring-inset ${v.ring} ${v.bg} ${v.text}`}
              >
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span
                    className={`absolute inset-0 animate-ping rounded-full opacity-70`}
                    style={{
                      backgroundColor:
                        analysis.verdict === "MALICIOUS"
                          ? "#fb7185"
                          : analysis.verdict === "SUSPICIOUS"
                            ? "#fbbf24"
                            : "#34d399",
                    }}
                  />
                  <span
                    className="relative inline-flex h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        analysis.verdict === "MALICIOUS"
                          ? "#fb7185"
                          : analysis.verdict === "SUSPICIOUS"
                            ? "#fbbf24"
                            : "#34d399",
                    }}
                  />
                </span>
                <VerdictIcon size={16} strokeWidth={2.4} />
                {v.label}
              </span>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-200">
                {analysis.summary}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <Sparkles size={11} /> {meta.model} · {meta.latencyMs} ms
            </span>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
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
          <div className="relative mt-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-200">
            <strong>Punycode decoded:</strong>{" "}
            <span className="font-mono">{parts.unicodeHostname}</span>
          </div>
        ) : null}
      </div>

      {data.domainInfo ? <DomainInfoCard info={data.domainInfo} /> : null}

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

      <details className="group surface p-4">
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
            <span className="text-muted">
              No structural checks triggered.
            </span>
          ) : (
            heuristicFindings.map((f) => (
              <div
                key={f.id}
                className="surface-flat p-3"
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

function DomainInfoCard({ info }: { info: DomainInfoSummary }) {
  const age = info.ageDays;
  const tone =
    age !== null && age < 7
      ? { ring: "ring-rose-400/40", text: "text-rose-200", chip: "bg-rose-500/15" }
      : age !== null && age < 30
        ? {
            ring: "ring-amber-400/40",
            text: "text-amber-200",
            chip: "bg-amber-500/15",
          }
        : age !== null && age < 180
          ? {
              ring: "ring-sky-400/40",
              text: "text-sky-200",
              chip: "bg-sky-500/15",
            }
          : {
              ring: "ring-emerald-400/40",
              text: "text-emerald-200",
              chip: "bg-emerald-500/15",
            };

  const ageLabel = info.unknown
    ? "not disclosed by registry"
    : age === null
      ? "—"
      : age === 0
        ? "registered today"
        : `${age} day${age === 1 ? "" : "s"} old`;

  return (
    <section className={`surface p-5 ring-1 ring-inset ${tone.ring}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Globe2 size={16} className="text-cyan-300" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          Domain intelligence
        </h3>
        <span className="text-xs text-muted">
          live RDAP lookup · cached 1h
        </span>
        {age !== null ? (
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${tone.chip} ${tone.text} ${tone.ring}`}
          >
            <CalendarClock size={11} />
            {ageLabel}
          </span>
        ) : null}
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
        <Field label="Domain" value={info.domain} mono />
        <Field
          label="Registered"
          value={info.registered ? formatDate(info.registered) : "unknown"}
          mono
        />
        <Field
          label="Registrar"
          value={info.registrar ?? "—"}
        />
        <Field
          label="Expires"
          value={info.expires ? formatDate(info.expires) : "—"}
          mono
        />
      </dl>
      {info.unknown ? (
        <p className="mt-3 text-xs text-muted">
          The registry returned no registration date — common for ccTLDs (e.g.
          .pl, .de) and some privacy-focused TLDs. Age can&apos;t be used as a
          signal here.
        </p>
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="surface-flat p-3">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate text-sm text-slate-100 ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function formatDate(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return iso;
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
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
    <div className="surface-flat p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
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
    <div className="surface p-5">
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
