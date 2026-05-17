"use client";

import {
  ChevronDown,
  Fingerprint,
  KeyRound,
  MailWarning,
  ShieldCheck,
  ShieldX,
  Sigma,
} from "lucide-react";
import type {
  DkimInspectionResult,
  DmarcSummary,
  SpfSummary,
} from "@/lib/types";

const STATUS_PILL = {
  good: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/40",
  warn: "bg-amber-500/10 text-amber-300 ring-amber-400/40",
  bad: "bg-rose-500/10 text-rose-300 ring-rose-400/40",
  unknown: "bg-slate-500/10 text-slate-300 ring-slate-400/40",
} as const;

type Tone = keyof typeof STATUS_PILL;

function tonePill(tone: Tone, label: string, icon: React.ReactNode) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${STATUS_PILL[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

export function EmailAuthPanel({
  spf,
  dkim,
  dmarc,
}: {
  spf: SpfSummary | null;
  dkim: DkimInspectionResult[];
  dmarc: DmarcSummary | null;
}) {
  if (!spf && !dmarc && (!dkim || dkim.length === 0)) return null;

  const haveAny = (spf && spf.found) || (dmarc && dmarc.found) || dkim.length > 0;

  return (
    <details className="group surface p-5" open>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
        <ShieldCheck size={15} className="text-cyan-300" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          Email authentication
        </h3>
        <span className="text-xs text-muted">
          live SPF / DKIM / DMARC via DoH · what receivers actually evaluate
        </span>
        <ChevronDown
          size={14}
          className="ml-auto text-slate-500 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <SpfCard spf={spf} />
        <DmarcCard dmarc={dmarc} />
        <DkimSummary reports={dkim} />
      </div>

      {!haveAny ? (
        <p className="mt-3 text-[11px] text-muted">
          No SPF / DKIM / DMARC records published for the From domain — receivers
          fall back to default behavior. Effectively no inbound authentication.
        </p>
      ) : null}
    </details>
  );
}

function SpfCard({ spf }: { spf: SpfSummary | null }) {
  if (!spf) {
    return (
      <Card title="SPF" tone="unknown" pill={tonePill("unknown", "no data", null)}>
        <p className="text-xs text-muted">
          Couldn&apos;t reach DNS for SPF lookup. Skipped.
        </p>
      </Card>
    );
  }
  if (!spf.found) {
    return (
      <Card
        title="SPF"
        tone="bad"
        pill={tonePill("bad", "missing", <ShieldX size={11} strokeWidth={2.4} />)}
      >
        <p className="text-xs text-slate-300">
          No <code className="font-mono">v=spf1</code> record at{" "}
          <span className="font-mono text-slate-100">{spf.domain}</span>.
          Receivers have no policy to enforce.
        </p>
      </Card>
    );
  }

  const tail = spf.allQualifier;
  const tone: Tone =
    tail === "-" ? "good" : tail === "~" ? "warn" : tail === "?" || tail === "+" ? "bad" : "warn";
  const tailLabel =
    tail === "-"
      ? "Strict (-all)"
      : tail === "~"
        ? "Softfail (~all)"
        : tail === "?"
          ? "Neutral (?all)"
          : tail === "+"
            ? "Open (+all)"
            : "Missing all";

  return (
    <Card
      title="SPF"
      tone={tone}
      pill={tonePill(
        tone,
        tailLabel,
        <ShieldCheck size={11} strokeWidth={2.4} />,
      )}
    >
      <dl className="grid gap-1.5 text-[11px]">
        <Row label="Domain" value={spf.domain} mono />
        <Row label="Includes" value={spf.includes.length.toString()} />
        <Row label="Mechanisms" value={spf.mechanismCount.toString()} />
      </dl>
      {spf.includes.length > 0 ? (
        <div className="mt-2">
          <div className="kicker mb-1">Include chain</div>
          <div className="flex flex-wrap gap-1">
            {spf.includes.slice(0, 6).map((inc, i) => (
              <span
                key={i}
                className="rounded bg-slate-100/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
              >
                {inc}
              </span>
            ))}
            {spf.includes.length > 6 ? (
              <span className="text-[10px] text-muted">
                … and {spf.includes.length - 6} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      {spf.raw ? (
        <details className="mt-2 group/raw">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-muted hover:text-slate-300">
            Raw record
          </summary>
          <pre className="mt-1 max-h-24 overflow-auto scrollbar-thin whitespace-pre-wrap break-all rounded bg-slate-950/60 p-2 font-mono text-[10px] text-slate-300">
            {spf.raw}
          </pre>
        </details>
      ) : null}
    </Card>
  );
}

function DmarcCard({ dmarc }: { dmarc: DmarcSummary | null }) {
  if (!dmarc) {
    return (
      <Card title="DMARC" tone="unknown" pill={tonePill("unknown", "no data", null)}>
        <p className="text-xs text-muted">Couldn&apos;t reach DNS for DMARC lookup.</p>
      </Card>
    );
  }
  if (!dmarc.found) {
    return (
      <Card
        title="DMARC"
        tone="bad"
        pill={tonePill("bad", "missing", <ShieldX size={11} strokeWidth={2.4} />)}
      >
        <p className="text-xs text-slate-300">
          No DMARC at{" "}
          <span className="font-mono text-slate-100">
            _dmarc.{dmarc.domain}
          </span>
          . Receivers can&apos;t escalate SPF/DKIM failures.
        </p>
      </Card>
    );
  }

  const tone: Tone =
    dmarc.p === "reject" && (dmarc.pct === null || dmarc.pct === 100)
      ? "good"
      : dmarc.p === "quarantine"
        ? "warn"
        : "bad";
  const pillLabel = `p=${dmarc.p ?? "?"}${dmarc.pct !== null && dmarc.pct < 100 ? ` · ${dmarc.pct}%` : ""}`;

  return (
    <Card
      title="DMARC"
      tone={tone}
      pill={tonePill(
        tone,
        pillLabel,
        <MailWarning size={11} strokeWidth={2.4} />,
      )}
    >
      <dl className="grid gap-1.5 text-[11px]">
        <Row label="Policy (p=)" value={dmarc.p ?? "—"} mono />
        <Row label="Subdomain (sp=)" value={dmarc.sp ?? "(inherits p)"} mono />
        <Row
          label="Coverage"
          value={dmarc.pct !== null ? `${dmarc.pct}%` : "100% (default)"}
          mono
        />
        <Row
          label="Alignment"
          value={`SPF:${dmarc.aspf ?? "r"} · DKIM:${dmarc.adkim ?? "r"}`}
          mono
        />
      </dl>
      {dmarc.rua.length > 0 ? (
        <div className="mt-2">
          <div className="kicker mb-1">Aggregate reports</div>
          <div className="flex flex-wrap gap-1">
            {dmarc.rua.slice(0, 2).map((u, i) => (
              <span
                key={i}
                className="truncate max-w-[180px] rounded bg-slate-100/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                title={u}
              >
                {u.replace(/^mailto:/, "")}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function DkimSummary({ reports }: { reports: DkimInspectionResult[] }) {
  if (!reports || reports.length === 0) {
    return (
      <Card
        title="DKIM"
        tone="bad"
        pill={tonePill(
          "bad",
          "no signature",
          <ShieldX size={11} strokeWidth={2.4} />,
        )}
      >
        <p className="text-xs text-slate-300">
          Email carries no DKIM-Signature header — receivers can&apos;t
          cryptographically attribute the message to any domain.
        </p>
      </Card>
    );
  }

  const allOK = reports.every((r) => r.keyStatus === "present");
  const anyBad = reports.some(
    (r) => r.keyStatus === "missing" || r.keyStatus === "revoked",
  );
  const tone: Tone = allOK ? "good" : anyBad ? "bad" : "warn";

  return (
    <Card
      title="DKIM"
      tone={tone}
      pill={tonePill(
        tone,
        allOK ? "keys resolve" : anyBad ? "key issue" : "partial",
        <Fingerprint size={11} strokeWidth={2.4} />,
      )}
    >
      <ul className="grid gap-2 text-[11px]">
        {reports.map((r, i) => (
          <li
            key={i}
            className="rounded-md bg-slate-100/[0.03] p-2 ring-1 ring-inset ring-[var(--border)]"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <KeyRound size={10} className="text-slate-400" />
              <span className="font-mono text-slate-100">
                {r.signingDomain ?? "(no d=)"}
              </span>
              <span className="font-mono text-[10px] text-muted">
                sel: {r.selector ?? "—"}
              </span>
              <span
                className={`ml-auto rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                  r.keyStatus === "present"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : r.keyStatus === "missing" || r.keyStatus === "revoked"
                      ? "bg-rose-500/15 text-rose-300"
                      : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {r.keyStatus}
              </span>
            </div>
            {r.algorithm ? (
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                <Sigma size={9} />
                {r.algorithm}
                {r.publicKeyAlgorithm
                  ? ` · k=${r.publicKeyAlgorithm}`
                  : ""}
              </div>
            ) : null}
            {r.notes.length > 0 ? (
              <ul className="mt-1.5 grid gap-0.5 text-[10px] text-amber-200">
                {r.notes.map((n, j) => (
                  <li key={j}>· {n}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Card({
  title,
  pill,
  children,
  tone,
}: {
  title: string;
  pill: React.ReactNode;
  children: React.ReactNode;
  tone: Tone;
}) {
  return (
    <div
      className={`surface-flat p-4 ring-1 ring-inset ${
        STATUS_PILL[tone].split(" ").pop() ?? "ring-[var(--border)]"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
          {title}
        </span>
        {pill}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd
        className={`truncate text-slate-200 ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
