"use client";

import {
  CheckCircle2,
  ChevronDown,
  Fingerprint,
  KeyRound,
  ShieldX,
  Sigma,
} from "lucide-react";
import type { DkimInspectionResult } from "@/lib/types";

const STATUS_STYLES: Record<
  DkimInspectionResult["keyStatus"],
  { label: string; ring: string; bg: string; text: string; Icon: typeof CheckCircle2 }
> = {
  present: {
    label: "Key resolves",
    ring: "ring-emerald-400/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    Icon: CheckCircle2,
  },
  missing: {
    label: "Key missing",
    ring: "ring-rose-400/40",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    Icon: ShieldX,
  },
  revoked: {
    label: "Key revoked",
    ring: "ring-rose-400/40",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    Icon: ShieldX,
  },
  malformed: {
    label: "Signature malformed",
    ring: "ring-amber-400/40",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    Icon: ShieldX,
  },
  "lookup-failed": {
    label: "DNS lookup failed",
    ring: "ring-slate-400/40",
    bg: "bg-slate-500/10",
    text: "text-slate-300",
    Icon: KeyRound,
  },
};

export function DkimInspection({
  reports,
}: {
  reports: DkimInspectionResult[];
}) {
  if (!reports || reports.length === 0) return null;

  return (
    <details className="group surface p-5" open={reports.length === 1}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
        <Fingerprint size={15} className="text-cyan-300" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          DKIM signature inspection
        </h3>
        <span className="text-xs text-muted">
          {reports.length} signature{reports.length === 1 ? "" : "s"} ·
          live DNS public-key check via Cloudflare DoH
        </span>
        <ChevronDown
          size={14}
          className="ml-auto text-slate-500 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="mt-4 grid gap-3">
        {reports.map((r, i) => {
          const s = STATUS_STYLES[r.keyStatus];
          const Icon = s.Icon;
          return (
            <div
              key={i}
              className={`surface-flat p-4 ring-1 ring-inset ${s.ring}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${s.bg} ${s.text}`}
                >
                  <Icon size={11} strokeWidth={2.4} />
                  {s.label}
                </span>
                {r.signingDomain ? (
                  <span className="font-mono text-sm text-slate-100">
                    {r.signingDomain}
                  </span>
                ) : null}
                {r.selector ? (
                  <span className="font-mono text-[11px] text-muted">
                    sel: {r.selector}
                  </span>
                ) : null}
                {r.algorithm ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded bg-slate-100/[0.04] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-300">
                    <Sigma size={10} />
                    {r.algorithm}
                  </span>
                ) : null}
              </div>

              <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-[11px]">
                {r.canonicalization ? (
                  <Field
                    label="Canonicalization"
                    value={r.canonicalization}
                    mono
                  />
                ) : null}
                {r.publicKeyAlgorithm ? (
                  <Field
                    label="Public-key algorithm"
                    value={r.publicKeyAlgorithm}
                    mono
                  />
                ) : null}
                {r.publicKeySnippet ? (
                  <Field
                    label="Public key"
                    value={r.publicKeySnippet}
                    mono
                  />
                ) : null}
              </dl>

              {r.headersSigned && r.headersSigned.length > 0 ? (
                <div className="mt-3">
                  <div className="kicker mb-1">Signed headers</div>
                  <div className="flex flex-wrap gap-1">
                    {r.headersSigned.map((h, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center rounded bg-slate-100/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {r.notes.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-[11px] text-amber-200">
                  {r.notes.map((n, j) => (
                    <li key={j}>· {n}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
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
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-slate-200 ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
