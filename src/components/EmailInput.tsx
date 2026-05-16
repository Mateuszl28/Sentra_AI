"use client";

import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { EXAMPLES, type EmailExample } from "@/lib/examples";

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
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-1.5 shadow-[0_0_60px_-20px_rgba(56,189,248,0.15)] backdrop-blur">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="ml-2 font-mono tracking-tight">
              paste raw email · including headers
            </span>
          </span>
          {value ? (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setActiveExample(null);
                onReset();
              }}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
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
          className="block min-h-[260px] w-full resize-y rounded-2xl bg-slate-950/60 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none ring-1 ring-inset ring-slate-800/80 focus:ring-sky-500/60 scrollbar-thin"
        />
      </div>

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
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
            <Upload size={13} />
            Upload .eml
          </button>
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            or pick an example →
          </span>
        </div>

        <button
          type="button"
          disabled={!value.trim() || loading}
          onClick={onAnalyze}
          className="group inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_8px_30px_-10px_rgba(56,189,248,0.6)] transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 sm:self-auto"
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

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => loadExample(ex)}
            title={ex.description}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all ${
              activeExample === ex.id
                ? "bg-sky-500/15 text-sky-200 ring-sky-400/40"
                : "bg-slate-900/40 text-slate-300 ring-slate-700 hover:bg-slate-800/70 hover:text-slate-100"
            }`}
          >
            {ex.label}
            <span
              className={`ml-2 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider ${
                ex.expected === "PHISHING"
                  ? "bg-rose-500/20 text-rose-300"
                  : ex.expected === "SUSPICIOUS"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {ex.expected}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
