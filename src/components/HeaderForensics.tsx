"use client";

import {
  ChevronDown,
  Clock,
  Globe2,
  Network,
  Route,
  Server,
  ShieldAlert,
} from "lucide-react";
import type { ReceivedHop } from "@/lib/types";

export function HeaderForensics({ chain }: { chain: ReceivedHop[] }) {
  if (chain.length === 0) {
    return (
      <div className="surface p-5 text-sm text-muted">
        <div className="mb-2 flex items-center gap-2">
          <Network size={15} className="text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">
            Header forensics
          </h3>
        </div>
        <p>
          No Received headers were present in this message. Forwarded emails or
          stripped-down pastes often lose the SMTP trace.
        </p>
      </div>
    );
  }

  const totalGap = chain.reduce(
    (acc, h) => acc + (h.gapMs && h.gapMs > 0 ? h.gapMs : 0),
    0,
  );
  const origin = chain[0];
  const final = chain[chain.length - 1];

  return (
    <details className="group surface p-5" open>
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
        <Network size={15} className="text-cyan-400" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          Header forensics
        </h3>
        <span className="text-xs text-muted">
          {chain.length} {chain.length === 1 ? "hop" : "hops"}
          {totalGap > 0 ? ` · total transit ${formatDuration(totalGap)}` : ""}
        </span>
        <ChevronDown
          size={14}
          className="ml-auto text-slate-500 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<Globe2 size={13} />}
          label="Origin"
          value={origin.fromHost ?? origin.fromIp ?? "—"}
          sub={origin.fromIp && origin.fromHost ? origin.fromIp : null}
        />
        <SummaryCard
          icon={<Server size={13} />}
          label="Final relay"
          value={final.byHost ?? "—"}
          sub={final.protocol ? `via ${final.protocol}` : null}
        />
        <SummaryCard
          icon={<Route size={13} />}
          label="Hop count"
          value={`${chain.length}`}
          sub={chain.length === 1 ? "suspicious" : "normal"}
        />
      </div>

      <ol className="relative mt-5 ml-1 grid gap-3 border-l hairline pl-5">
        {chain.map((hop) => {
          const isPrivate =
            hop.fromIp &&
            (hop.fromIp.startsWith("10.") ||
              hop.fromIp.startsWith("192.168.") ||
              /^172\.(1[6-9]|2\d|3[01])\./.test(hop.fromIp));
          const tone = isPrivate
            ? "bg-amber-500/20 ring-amber-400/40 text-amber-200"
            : "bg-sky-500/15 ring-sky-400/40 text-sky-200";
          return (
            <li key={hop.index} className="relative">
              <span
                className={`absolute -left-[26px] top-1 inline-flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-inset ${tone}`}
              >
                <span className="font-mono text-[9px] font-bold">
                  {hop.index + 1}
                </span>
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                <span className="font-mono text-slate-100">
                  {hop.fromHost ?? "(unknown sender)"}
                </span>
                {hop.fromIp ? (
                  <span className="font-mono text-[11px] text-muted">
                    [{hop.fromIp}]
                  </span>
                ) : null}
                {isPrivate ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-200 ring-1 ring-inset ring-amber-400/30">
                    <ShieldAlert size={9} /> private IP
                  </span>
                ) : null}
                <span className="text-slate-500">→</span>
                <span className="font-mono text-slate-300">
                  {hop.byHost ?? "(unknown relay)"}
                </span>
                {hop.protocol ? (
                  <span className="rounded bg-slate-100/[0.04] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                    {hop.protocol}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                {hop.date ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={10} /> {hop.date}
                  </span>
                ) : null}
                {typeof hop.gapMs === "number" && hop.gapMs !== 0 ? (
                  <span
                    className={`inline-flex items-center gap-1 font-mono ${
                      hop.gapMs < 0 || hop.gapMs > 60 * 60 * 1000
                        ? "text-rose-300"
                        : "text-slate-500"
                    }`}
                  >
                    +{formatDuration(hop.gapMs)} from previous
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string | null;
}) {
  return (
    <div className="surface-flat p-3">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
        {icon}
        {label}
      </div>
      <div
        className="mt-1 truncate font-mono text-sm text-slate-100"
        title={value}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 truncate font-mono text-[11px] text-muted">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  if (abs < 1000) return `${ms} ms`;
  const sec = ms / 1000;
  if (Math.abs(sec) < 60) return `${sec.toFixed(1)}s`;
  const min = sec / 60;
  if (Math.abs(min) < 60) return `${min.toFixed(1)}m`;
  const hr = min / 60;
  return `${hr.toFixed(1)}h`;
}
