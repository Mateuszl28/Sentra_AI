"use client";

import {
  Loader2,
  Minus,
  Plus,
  ScanSearch,
  SplitSquareHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EXAMPLES } from "@/lib/examples";
import type { AnalysisResponse, HeuristicFinding } from "@/lib/types";
import { RiskGauge } from "./RiskGauge";
import { VerdictBadge } from "./VerdictBadge";

type Slot = "A" | "B";

type SlotState = {
  raw: string;
  result: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
};

const PRESETS: { label: string; rawIds: [string, string] }[] = [
  { label: "PayPal phish vs Stripe legit", rawIds: ["paypal-classic", "legit-stripe"] },
  { label: "Microsoft phish vs GitHub legit", rawIds: ["microsoft-365", "legit-github"] },
  { label: "Apple lock vs LinkedIn subtle", rawIds: ["apple-id-lock", "linkedin-clone"] },
];

function emptySlot(): SlotState {
  return { raw: "", result: null, loading: false, error: null };
}

function findExample(id: string) {
  return EXAMPLES.find((e) => e.id === id) ?? null;
}

export function CompareMode() {
  const [slots, setSlots] = useState<Record<Slot, SlotState>>({
    A: emptySlot(),
    B: emptySlot(),
  });

  const both =
    slots.A.result && slots.B.result
      ? { A: slots.A.result, B: slots.B.result }
      : null;

  const diff = useMemo(() => {
    if (!both) return null;
    return computeDiff(both.A, both.B);
  }, [both]);

  function setRaw(slot: Slot, raw: string) {
    setSlots((s) => ({
      ...s,
      [slot]: { ...s[slot], raw, result: null, error: null },
    }));
  }

  function loadPreset(p: (typeof PRESETS)[number]) {
    const a = findExample(p.rawIds[0]);
    const b = findExample(p.rawIds[1]);
    setSlots({
      A: { ...emptySlot(), raw: a?.raw ?? "" },
      B: { ...emptySlot(), raw: b?.raw ?? "" },
    });
  }

  async function compare() {
    const promises: Promise<void>[] = [];
    setSlots((s) => ({
      A: { ...s.A, loading: !!s.A.raw.trim(), error: null, result: null },
      B: { ...s.B, loading: !!s.B.raw.trim(), error: null, result: null },
    }));
    for (const slot of ["A", "B"] as Slot[]) {
      promises.push(runOne(slot));
    }
    await Promise.all(promises);
  }

  async function runOne(slot: Slot) {
    const raw = slot === "A" ? slots.A.raw.trim() : slots.B.raw.trim();
    if (!raw) return;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setSlots((s) => ({
        ...s,
        [slot]: {
          ...s[slot],
          loading: false,
          result: data as AnalysisResponse,
        },
      }));
    } catch (err) {
      setSlots((s) => ({
        ...s,
        [slot]: {
          ...s[slot],
          loading: false,
          error: err instanceof Error ? err.message : "Failed.",
        },
      }));
    }
  }

  const canCompare =
    slots.A.raw.trim() &&
    slots.B.raw.trim() &&
    !slots.A.loading &&
    !slots.B.loading;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          preset →
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => loadPreset(p)}
            className="rounded-full bg-slate-900/40 px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-slate-700 hover:bg-slate-800/70 hover:text-slate-100"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SlotEditor
          slot="A"
          state={slots.A}
          onChange={(v) => setRaw("A", v)}
          onClear={() => setSlots((s) => ({ ...s, A: emptySlot() }))}
        />
        <SlotEditor
          slot="B"
          state={slots.B}
          onChange={(v) => setRaw("B", v)}
          onClear={() => setSlots((s) => ({ ...s, B: emptySlot() }))}
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          disabled={!canCompare}
          onClick={compare}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-sky-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_8px_30px_-10px_rgba(217,70,239,0.6)] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
        >
          {slots.A.loading || slots.B.loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Analyzing both…
            </>
          ) : (
            <>
              <SplitSquareHorizontal size={14} /> Compare both
            </>
          )}
        </button>
      </div>

      {both ? (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ResultColumn slot="A" data={both.A} />
            <ResultColumn slot="B" data={both.B} />
          </div>
          {diff ? <DiffPanel diff={diff} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function SlotEditor({
  slot,
  state,
  onChange,
  onClear,
}: {
  slot: Slot;
  state: SlotState;
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-1.5">
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-2 font-mono tracking-tight">
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
              slot === "A"
                ? "bg-fuchsia-500/20 text-fuchsia-200"
                : "bg-sky-500/20 text-sky-200"
            }`}
          >
            {slot}
          </span>
          <span>{slot === "A" ? "suspect" : "baseline"}</span>
        </span>
        {state.raw ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
          >
            <X size={11} />
          </button>
        ) : null}
      </div>
      <textarea
        value={state.raw}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={`Paste email ${slot}…`}
        className="block min-h-[220px] w-full resize-y rounded-2xl bg-slate-950/60 px-4 py-3 font-mono text-[12px] leading-relaxed text-slate-200 placeholder:text-slate-600 outline-none ring-1 ring-inset ring-slate-800/80 focus:ring-fuchsia-500/60 scrollbar-thin"
      />
      {state.error ? (
        <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {state.error}
        </div>
      ) : null}
    </div>
  );
}

function ResultColumn({ slot, data }: { slot: Slot; data: AnalysisResponse }) {
  const { analysis, parsed } = data;
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
            slot === "A"
              ? "bg-fuchsia-500/20 text-fuchsia-200"
              : "bg-sky-500/20 text-sky-200"
          }`}
        >
          {slot}
        </span>
        <span className="truncate text-xs text-slate-400" title={parsed.subject ?? ""}>
          {parsed.subject ?? "(no subject)"}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <RiskGauge score={analysis.riskScore} verdict={analysis.verdict} />
        <div className="space-y-2">
          <VerdictBadge verdict={analysis.verdict} size="sm" />
          <p className="text-xs leading-relaxed text-slate-300">
            {analysis.summary}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <Cell label="From" value={parsed.fromAddress ?? "—"} mono />
        <Cell
          label="Auth"
          value={`SPF:${parsed.authResults.spf}/DKIM:${parsed.authResults.dkim}/DMARC:${parsed.authResults.dmarc}`}
          mono
        />
      </div>
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Red flags ({analysis.redFlags.length})
        </div>
        <ul className="mt-1 space-y-1">
          {analysis.redFlags.slice(0, 5).map((f, i) => (
            <li
              key={i}
              className="truncate text-xs text-slate-300"
              title={f.explanation}
            >
              · {f.title}
            </li>
          ))}
          {analysis.redFlags.length === 0 ? (
            <li className="text-xs text-slate-500">— none —</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-950/50 px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-0.5 truncate text-[11px] text-slate-200 ${
          mono ? "font-mono" : ""
        }`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

type DiffShape = {
  scoreDelta: number;
  verdictChanged: boolean;
  onlyA: HeuristicFinding[];
  onlyB: HeuristicFinding[];
  inBoth: HeuristicFinding[];
};

function computeDiff(a: AnalysisResponse, b: AnalysisResponse): DiffShape {
  const idsA = new Set(a.heuristicFindings.map((f) => f.id));
  const idsB = new Set(b.heuristicFindings.map((f) => f.id));
  return {
    scoreDelta: a.analysis.riskScore - b.analysis.riskScore,
    verdictChanged: a.analysis.verdict !== b.analysis.verdict,
    onlyA: a.heuristicFindings.filter((f) => !idsB.has(f.id)),
    onlyB: b.heuristicFindings.filter((f) => !idsA.has(f.id)),
    inBoth: a.heuristicFindings.filter((f) => idsB.has(f.id)),
  };
}

function DiffPanel({ diff }: { diff: DiffShape }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <ScanSearch size={16} className="text-fuchsia-300" />
        <h3 className="text-sm font-semibold text-slate-100">Diff</h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            Math.abs(diff.scoreDelta) >= 25
              ? "bg-rose-500/15 text-rose-200"
              : Math.abs(diff.scoreDelta) >= 10
                ? "bg-amber-500/15 text-amber-200"
                : "bg-slate-500/15 text-slate-300"
          }`}
        >
          score Δ {diff.scoreDelta > 0 ? "+" : ""}
          {diff.scoreDelta}
        </span>
        {diff.verdictChanged ? (
          <span className="inline-flex items-center rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[11px] font-semibold text-fuchsia-200">
            verdict differs
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
            same verdict
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <DiffColumn
          label="Only in A (suspect)"
          accent="bg-fuchsia-500/15 text-fuchsia-200"
          icon={<Plus size={11} />}
          findings={diff.onlyA}
        />
        <DiffColumn
          label="In both"
          accent="bg-slate-500/15 text-slate-200"
          icon={<SplitSquareHorizontal size={11} />}
          findings={diff.inBoth}
        />
        <DiffColumn
          label="Only in B (baseline)"
          accent="bg-sky-500/15 text-sky-200"
          icon={<Minus size={11} />}
          findings={diff.onlyB}
        />
      </div>
    </div>
  );
}

function DiffColumn({
  label,
  accent,
  icon,
  findings,
}: {
  label: string;
  accent: string;
  icon: React.ReactNode;
  findings: HeuristicFinding[];
}) {
  return (
    <div>
      <div
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${accent}`}
      >
        {icon} {label}
      </div>
      <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
        {findings.length === 0 ? (
          <li className="text-slate-500">— none —</li>
        ) : (
          findings.map((f) => (
            <li key={f.id} title={f.detail} className="leading-snug">
              <span className="text-slate-100">{f.title}</span>
              <span className="ml-1 text-[10px] uppercase tracking-widest text-slate-500">
                {f.severity}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
