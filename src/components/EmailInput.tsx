"use client";

import {
  AlertTriangle,
  Info,
  Loader2,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EXAMPLES, type EmailExample } from "@/lib/examples";
import { runLiveHeuristics, type LiveFinding } from "@/lib/live-heuristics";

type Props = {
  value: string;
  setValue: (v: string) => void;
  loading: boolean;
  onAnalyze: () => void;
  onReset: () => void;
};

export function EmailInput({
  value,
  setValue,
  loading,
  onAnalyze,
  onReset,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeExample, setActiveExample] = useState<string | null>(null);
  const [liveFindings, setLiveFindings] = useState<LiveFinding[]>([]);

  useEffect(() => {
    if (!value || value.length < 20) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiveFindings([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setLiveFindings(runLiveHeuristics(value));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [value]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setValue(text);
      setActiveExample(null);
    };
    reader.readAsText(file);
  }

  function loadExample(ex: EmailExample) {
    setValue(ex.raw);
    setActiveExample(ex.id);
  }

  return (
    <div className="grid gap-4">
      <div className="surface-elev p-1.5">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            </span>
            <span className="font-mono uppercase tracking-[0.18em]">
              paste raw email · headers + body
            </span>
            {value.length > 0 ? (
              <span className="ml-2 font-mono text-[10px] tabular-nums text-slate-500">
                {value.length.toLocaleString()} chars
              </span>
            ) : null}
          </span>
          {value ? (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setActiveExample(null);
                onReset();
              }}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted transition hover:bg-slate-800/70 hover:text-slate-200"
            >
              <X size={11} /> clear
            </button>
          ) : null}
        </div>
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setActiveExample(null);
          }}
          spellCheck={false}
          placeholder={`From: "PayPal" <support@paypa1-secure.com>\nSubject: URGENT — verify your account within 24 hours\n…`}
          className="block min-h-[280px] w-full resize-y rounded-xl bg-[rgba(2,6,23,0.55)] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none ring-1 ring-inset ring-[var(--border)] transition focus:ring-sky-500/60 scrollbar-thin"
        />
      </div>

      <LiveHeuristicChips findings={liveFindings} hasContent={value.length > 20} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".eml,.txt,message/rfc822,text/plain"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-ghost"
          >
            <Upload size={13} />
            Upload .eml
          </button>
          <span className="hidden text-[11px] text-muted sm:inline">
            or pick a sample below →
          </span>
        </div>

        <button
          type="button"
          disabled={!value.trim() || loading}
          onClick={onAnalyze}
          className="btn-primary"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles size={15} strokeWidth={2.4} />
              Analyze email
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="kicker self-center mr-1">samples</span>
        {EXAMPLES.map((ex) => {
          const tone =
            ex.expected === "PHISHING"
              ? "bg-rose-500/15 text-rose-300"
              : ex.expected === "SUSPICIOUS"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-emerald-500/15 text-emerald-300";
          const active = activeExample === ex.id;
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => loadExample(ex)}
              title={ex.description}
              className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset transition ${
                active
                  ? "bg-sky-500/15 text-sky-200 ring-sky-400/40"
                  : "border hairline bg-slate-900/40 text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
              }`}
            >
              <span className={`h-1 w-1 rounded-full ${tone}`} />
              {ex.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LiveHeuristicChips({
  findings,
  hasContent,
}: {
  findings: LiveFinding[];
  hasContent: boolean;
}) {
  if (!hasContent) return null;
  if (findings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted animate-fade-in">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="font-mono uppercase tracking-[0.18em]">
          Live check · scanning for red flags
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
      <span className="kicker mr-1">live check</span>
      {findings.map((f) => {
        const Icon =
          f.tone === "danger"
            ? ShieldAlert
            : f.tone === "warn"
              ? AlertTriangle
              : Info;
        const cls =
          f.tone === "danger"
            ? "bg-rose-500/15 text-rose-200 ring-rose-400/30"
            : f.tone === "warn"
              ? "bg-amber-500/15 text-amber-200 ring-amber-400/30"
              : "bg-sky-500/15 text-sky-200 ring-sky-400/30";
        return (
          <span
            key={f.id}
            title={f.detail}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls}`}
          >
            <Icon size={10} strokeWidth={2.4} />
            {f.label}
          </span>
        );
      })}
    </div>
  );
}
