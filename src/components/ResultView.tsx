"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardCopy,
  Code2,
  GitMerge,
  GraduationCap,
  Mail,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { buildMarkdownReport } from "@/lib/report";
import type { AnalysisResponse } from "@/lib/types";
import { AnnotatedSource } from "./AnnotatedSource";
import { EmailAuthPanel } from "./EmailAuthPanel";
import { FollowUpChat } from "./FollowUpChat";
import { HeaderForensics } from "./HeaderForensics";
import { HtmlPreview } from "./HtmlPreview";
import { MitreBadge } from "./MitreBadge";
import { RedFlagCard } from "./RedFlagCard";
import { RiskGauge } from "./RiskGauge";
import { ShareButton } from "./ShareButton";
import { useToast } from "./Toast";
import { VerdictBadge } from "./VerdictBadge";

export function ResultView({
  data,
  rawEmail,
}: {
  data: AnalysisResponse;
  rawEmail: string;
}) {
  const { analysis, parsed, meta, heuristicFindings } = data;
  const [focusedFlagId, setFocusedFlagId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildMarkdownReport(data));
      setCopied(true);
      toast.push({
        tone: "success",
        title: "Markdown report copied",
        body: "Paste it into a ticket, doc, or chat.",
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.push({ tone: "error", title: "Clipboard unavailable" });
    }
  }

  return (
    <div className="grid gap-6">
      <div className="surface-elev relative overflow-hidden p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              analysis.verdict === "PHISHING"
                ? "radial-gradient(circle, rgba(244,63,94,0.6), transparent 60%)"
                : analysis.verdict === "SUSPICIOUS"
                  ? "radial-gradient(circle, rgba(251,191,36,0.5), transparent 60%)"
                  : "radial-gradient(circle, rgba(52,211,153,0.5), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <RiskGauge score={analysis.riskScore} verdict={analysis.verdict} />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <VerdictBadge verdict={analysis.verdict} size="lg" />
                {data.agreement ? (
                  <AgreementBadge agreement={data.agreement} />
                ) : null}
              </div>
              <p className="max-w-xl text-[15px] leading-relaxed text-slate-200">
                {analysis.summary}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
            <div className="flex items-center gap-2">
              <ShareButton data={data} rawEmail={rawEmail} />
              <button
                type="button"
                onClick={copyReport}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                  copied
                    ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40"
                    : "border hairline bg-slate-900/60 text-slate-200 hover:bg-slate-800"
                }`}
              >
                {copied ? (
                  <>
                    <ClipboardCheck size={12} /> Copied
                  </>
                ) : (
                  <>
                    <ClipboardCopy size={12} /> Copy report
                  </>
                )}
              </button>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <Sparkles size={11} /> {meta.model} · {meta.latencyMs} ms
            </span>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Stat label="From" value={parsed.fromAddress ?? "—"} mono />
          <Stat label="Subject" value={parsed.subject ?? "—"} />
          <Stat
            label="SPF / DKIM / DMARC"
            value={`${authBadge(parsed.authResults.spf)} / ${authBadge(parsed.authResults.dkim)} / ${authBadge(parsed.authResults.dmarc)}`}
            mono
          />
          <Stat
            label="Links / attachments"
            value={`${parsed.linkCount} link(s) · ${parsed.attachmentCount} attachment(s)`}
          />
        </div>
      </div>

      {analysis.redFlags.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">
              Red flags
            </h2>
            <span className="text-xs text-slate-500">
              {analysis.redFlags.length} found · click any card to highlight in
              source
            </span>
          </div>
          <div className="grid gap-3">
            {analysis.redFlags.map((flag, i) => (
              <RedFlagCard
                key={i}
                flag={flag}
                index={i}
                onFocus={() => setFocusedFlagId(`llm-${i}`)}
                isFocused={focusedFlagId === `llm-${i}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {parsed.receivedChain && parsed.receivedChain.length > 0 ? (
        <HeaderForensics chain={parsed.receivedChain} />
      ) : null}

      {parsed.spf || parsed.dmarc || (parsed.dkim && parsed.dkim.length > 0) ? (
        <EmailAuthPanel
          spf={parsed.spf ?? null}
          dmarc={parsed.dmarc ?? null}
          dkim={parsed.dkim ?? []}
        />
      ) : null}

      <HtmlPreview rawEmail={rawEmail} />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-cyan-400" />
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">
            Annotated source
          </h2>
          <span className="text-xs text-slate-500">
            highlights show exactly where each red flag came from
          </span>
        </div>
        <AnnotatedSource
          raw={rawEmail}
          redFlags={analysis.redFlags}
          heuristicFindings={heuristicFindings}
          focusedFlagId={focusedFlagId}
        />
      </section>

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

      <FollowUpChat data={data} rawEmail={rawEmail} />

      <details className="group surface p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Mail size={14} /> Deterministic heuristics (
            {heuristicFindings.length})
          </span>
          <ChevronDown
            size={14}
            className="transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="mt-4 grid gap-2 text-xs">
          {heuristicFindings.length === 0 ? (
            <span className="text-slate-500">
              No deterministic checks triggered.
            </span>
          ) : (
            heuristicFindings.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => f.evidence && setFocusedFlagId(f.id)}
                className={`text-left surface-flat p-3 transition-colors ${
                  f.evidence
                    ? "cursor-pointer hover:border-slate-700 hover:bg-slate-900/60"
                    : "cursor-default"
                } ${focusedFlagId === f.id ? "ring-1 ring-sky-400/60" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono uppercase tracking-wider">
                    {f.severity}
                  </span>
                  <span className="rounded bg-slate-800/40 px-1.5 py-0.5 font-mono uppercase tracking-wider">
                    {f.category}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {f.title}
                  </span>
                  <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
                    <MitreBadge findingId={f.id} compact />
                  </span>
                </div>
                <p className="mt-1.5 text-slate-400">{f.detail}</p>
                {f.evidence ? (
                  <pre className="mt-1.5 max-h-24 overflow-auto scrollbar-thin whitespace-pre-wrap rounded bg-slate-900/80 p-2 font-mono text-[10px] text-slate-400">
                    {f.evidence}
                  </pre>
                ) : null}
              </button>
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
    <div className="surface-flat p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </div>
      <div
        className={`mt-1 truncate text-sm text-slate-200 ${mono ? "font-mono" : ""}`}
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

function AgreementBadge({
  agreement,
}: {
  agreement: NonNullable<AnalysisResponse["agreement"]>;
}) {
  const palette =
    agreement.band === "aligned"
      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/40"
      : agreement.band === "split"
        ? "bg-amber-500/10 text-amber-300 ring-amber-400/40"
        : "bg-rose-500/10 text-rose-300 ring-rose-400/40";
  return (
    <span
      title={`${agreement.explanation}\n\nHeuristics ${agreement.heuristicScore} · Gemini ${agreement.llmScore} · Δ ${agreement.delta}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${palette}`}
    >
      <GitMerge size={11} strokeWidth={2.4} />
      {agreement.label}
      <span className="font-mono text-[10px] tabular-nums opacity-80">
        Δ{agreement.delta}
      </span>
    </span>
  );
}

function authBadge(v: string) {
  if (v === "pass") return "✓ pass";
  if (v === "fail" || v === "permerror" || v === "temperror") return "✗ " + v;
  if (v === "softfail") return "~ softfail";
  if (v === "none") return "— none";
  return "? " + v;
}
