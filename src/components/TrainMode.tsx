"use client";

import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Repeat,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EXAMPLES, type EmailExample } from "@/lib/examples";
import type { Verdict } from "@/lib/types";
import { VerdictBadge } from "./VerdictBadge";

const VERDICT_OPTIONS: { value: Verdict; label: string; description: string }[] =
  [
    {
      value: "SAFE",
      label: "SAFE",
      description: "Looks legitimate",
    },
    {
      value: "SUSPICIOUS",
      label: "SUSPICIOUS",
      description: "Some red flags but unclear",
    },
    {
      value: "PHISHING",
      label: "PHISHING",
      description: "Almost certainly malicious",
    },
  ];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function TrainMode({
  onSendToAnalyzer,
}: {
  onSendToAnalyzer?: (raw: string) => void;
}) {
  const [deck, setDeck] = useState<EmailExample[]>(() => shuffle(EXAMPLES));
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<Verdict | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = deck[index];
  const finished = index >= deck.length;
  const correct = guess === current?.expected;

  const progressPct = useMemo(
    () => Math.round((index / deck.length) * 100),
    [index, deck.length],
  );

  function pick(v: Verdict) {
    if (guess) return;
    setGuess(v);
    setScore((s) => ({
      correct: s.correct + (v === current.expected ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setGuess(null);
    setIndex((i) => i + 1);
  }

  function restart() {
    setDeck(shuffle(EXAMPLES));
    setIndex(0);
    setGuess(null);
    setScore({ correct: 0, total: 0 });
  }

  if (finished) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const trophy =
      pct === 100
        ? "Bulletproof — you spotted every one."
        : pct >= 80
          ? "Sharp eye. You'd survive most real-world inboxes."
          : pct >= 50
            ? "Decent. Worth reviewing the ones you missed."
            : "Phishers would love your inbox. Try again with a fresh deck.";
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <Trophy size={36} className="mx-auto text-amber-300" />
        <h2 className="mt-3 text-2xl font-semibold text-slate-100">
          {score.correct}/{score.total} correct · {pct}%
        </h2>
        <p className="mt-2 text-sm text-slate-300">{trophy}</p>
        <button
          type="button"
          onClick={restart}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:brightness-110"
        >
          <Repeat size={14} /> Play again
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <GraduationCap size={13} className="text-cyan-400" />
          <span className="font-mono uppercase tracking-[0.18em]">
            Train mode · email {index + 1}/{deck.length}
          </span>
        </span>
        <span className="font-mono tabular-nums">
          Score {score.correct}/{score.total}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-1.5">
        <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="ml-2 font-mono tracking-tight">
            read carefully — what's your call?
          </span>
        </div>
        <pre className="max-h-[420px] overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-4 font-mono text-[11.5px] leading-[1.55] text-slate-300">
          {current.raw}
        </pre>
      </div>

      {guess ? (
        <div
          className={`rounded-3xl border p-6 ${
            correct
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-rose-500/40 bg-rose-500/5"
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            {correct ? (
              <CheckCircle2 size={22} className="text-emerald-300" />
            ) : (
              <XCircle size={22} className="text-rose-300" />
            )}
            <span
              className={`text-base font-semibold ${
                correct ? "text-emerald-200" : "text-rose-200"
              }`}
            >
              {correct ? "Correct!" : "Not quite."}
            </span>
            <span className="text-xs text-slate-400">
              Your call:
            </span>
            <VerdictBadge verdict={guess} size="sm" />
            <span className="text-xs text-slate-400">· Actual:</span>
            <VerdictBadge verdict={current.expected} size="sm" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            <strong className="text-slate-100">{current.label}.</strong>{" "}
            {current.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110"
            >
              <ArrowRight size={14} />{" "}
              {index === deck.length - 1 ? "Finish" : "Next email"}
            </button>
            {onSendToAnalyzer ? (
              <button
                type="button"
                onClick={() => onSendToAnalyzer(current.raw)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                <Sparkles size={13} /> See full AI analysis
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-3">
          {VERDICT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className={`group flex flex-col items-start rounded-2xl border bg-slate-900/40 p-4 text-left transition-all hover:bg-slate-900/70 ${
                opt.value === "PHISHING"
                  ? "border-rose-500/30 hover:border-rose-400/60"
                  : opt.value === "SUSPICIOUS"
                    ? "border-amber-500/30 hover:border-amber-400/60"
                    : "border-emerald-500/30 hover:border-emerald-400/60"
              }`}
            >
              <VerdictBadge verdict={opt.value} size="sm" />
              <span className="mt-2 text-xs text-slate-400">
                {opt.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
