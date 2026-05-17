"use client";

import { useEffect, useMemo, useRef } from "react";
import type { HeuristicFinding, LlmRedFlag, Severity } from "@/lib/types";

type Annotation = {
  start: number;
  end: number;
  flagId: string;
  severity: Severity;
  label: string;
};

const SEVERITY_BG: Record<Severity, string> = {
  high: "bg-rose-500/25 text-rose-100 ring-1 ring-inset ring-rose-400/50",
  medium:
    "bg-amber-500/25 text-amber-100 ring-1 ring-inset ring-amber-400/50",
  low: "bg-sky-500/20 text-sky-100 ring-1 ring-inset ring-sky-400/40",
  info: "bg-slate-500/20 text-slate-100 ring-1 ring-inset ring-slate-400/40",
};

const SEVERITY_PULSE: Record<Severity, string> = {
  high: "ring-rose-400",
  medium: "ring-amber-400",
  low: "ring-sky-400",
  info: "ring-slate-400",
};

export function AnnotatedSource({
  raw,
  redFlags,
  heuristicFindings,
  focusedFlagId,
}: {
  raw: string;
  redFlags: LlmRedFlag[];
  heuristicFindings: HeuristicFinding[];
  focusedFlagId: string | null;
}) {
  const containerRef = useRef<HTMLPreElement>(null);

  const annotations = useMemo(() => {
    const out: Annotation[] = [];

    heuristicFindings.forEach((f) => {
      if (!f.evidence) return;
      addMatches(out, raw, f.evidence, {
        flagId: f.id,
        severity: f.severity,
        label: f.title,
      });
    });

    redFlags.forEach((f, i) => {
      if (!f.evidence) return;
      addMatches(out, raw, f.evidence, {
        flagId: `llm-${i}`,
        severity: f.severity,
        label: f.title,
      });
    });

    return mergeOverlaps(out);
  }, [raw, redFlags, heuristicFindings]);

  useEffect(() => {
    if (!focusedFlagId || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-flag-id="${cssSafe(focusedFlagId)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-offset-2", "ring-offset-slate-950");
    el.style.transition = "box-shadow 200ms ease";
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-offset-2", "ring-offset-slate-950");
    }, 1500);
  }, [focusedFlagId]);

  const segments = useMemo(
    () => buildSegments(raw, annotations),
    [raw, annotations],
  );

  return (
    <pre
      ref={containerRef}
      className="max-h-[420px] overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-2xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-[11.5px] leading-[1.55] text-slate-300"
    >
      {segments.map((seg, i) =>
        seg.annotation ? (
          <mark
            key={i}
            data-flag-id={seg.annotation.flagId}
            title={seg.annotation.label}
            className={`rounded-[3px] px-[3px] py-[1px] cursor-help ${SEVERITY_BG[seg.annotation.severity]} ${SEVERITY_PULSE[seg.annotation.severity]}`}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </pre>
  );
}

function addMatches(
  out: Annotation[],
  haystack: string,
  needleRaw: string,
  meta: { flagId: string; severity: Severity; label: string },
) {
  const fragments = extractFragments(needleRaw);
  for (const frag of fragments) {
    if (frag.length < 4) continue;
    let from = 0;
    let safety = 0;
    while (safety++ < 20) {
      const idx = haystack.indexOf(frag, from);
      if (idx === -1) break;
      out.push({
        start: idx,
        end: idx + frag.length,
        flagId: meta.flagId,
        severity: meta.severity,
        label: meta.label,
      });
      from = idx + frag.length;
    }
  }
}

function extractFragments(evidence: string): string[] {
  const cleaned = evidence.replace(/\s+/g, " ").trim();
  const split = cleaned
    .split(/(?:\s*•\s*|\s*\n\s*|\s*•\s*)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const candidates = new Set<string>();
  for (const part of split) {
    candidates.add(part);
    const arrowMatch = part.match(/"?(.+?)"?\s*[→\->]\s*(.+)/);
    if (arrowMatch) {
      candidates.add(arrowMatch[1].trim().replace(/^"|"$/g, ""));
      candidates.add(arrowMatch[2].trim());
    }
    const headerMatch = part.match(/^[A-Za-z-]+:\s*(.+)$/);
    if (headerMatch) candidates.add(headerMatch[1].trim());
  }
  return Array.from(candidates).filter((s) => s.length >= 4 && s.length <= 200);
}

function mergeOverlaps(annotations: Annotation[]): Annotation[] {
  if (annotations.length === 0) return annotations;
  const sorted = [...annotations].sort(
    (a, b) => a.start - b.start || b.end - a.end,
  );
  const result: Annotation[] = [];
  for (const a of sorted) {
    const last = result[result.length - 1];
    if (last && a.start < last.end) {
      if (severityRank(a.severity) > severityRank(last.severity)) {
        last.severity = a.severity;
        last.flagId = a.flagId;
        last.label = a.label;
      }
      last.end = Math.max(last.end, a.end);
    } else {
      result.push({ ...a });
    }
  }
  return result;
}

function severityRank(s: Severity): number {
  return s === "high" ? 3 : s === "medium" ? 2 : s === "low" ? 1 : 0;
}

function buildSegments(
  raw: string,
  annotations: Annotation[],
): { text: string; annotation: Annotation | null }[] {
  if (annotations.length === 0) {
    return [{ text: raw, annotation: null }];
  }
  const segs: { text: string; annotation: Annotation | null }[] = [];
  let cursor = 0;
  for (const a of annotations) {
    if (a.start > cursor) {
      segs.push({ text: raw.slice(cursor, a.start), annotation: null });
    }
    segs.push({
      text: raw.slice(a.start, a.end),
      annotation: a,
    });
    cursor = a.end;
  }
  if (cursor < raw.length) {
    segs.push({ text: raw.slice(cursor), annotation: null });
  }
  return segs;
}

function cssSafe(s: string): string {
  return s.replace(/"/g, '\\"');
}
