"use client";

import {
  Activity,
  AlertOctagon,
  BarChart3,
  Clock,
  Link2,
  Mail,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useMemo } from "react";
import type { HistoryEntry } from "@/lib/useHistory";
import { DefenseBrief } from "./DefenseBrief";

type Verdict = "SAFE" | "SUSPICIOUS" | "PHISHING" | "MALICIOUS";

const VERDICT_COLOR: Record<Verdict, string> = {
  SAFE: "#34d399",
  SUSPICIOUS: "#fbbf24",
  PHISHING: "#fb7185",
  MALICIOUS: "#fb7185",
};

export function Insights({
  entries,
  onOpenEmail,
  onOpenUrl,
}: {
  entries: HistoryEntry[];
  onOpenEmail: (raw: string) => void;
  onOpenUrl: (url: string) => void;
}) {
  const stats = useMemo(() => computeStats(entries), [entries]);

  if (entries.length === 0) {
    return (
      <div className="surface-elev p-12 text-center">
        <BarChart3
          size={36}
          className="mx-auto text-slate-700"
          strokeWidth={1.5}
        />
        <h3 className="mt-3 text-base font-semibold text-slate-200">
          No data yet
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Analyze a few emails or URLs and come back. Charts populate from your
          local history — nothing is sent anywhere.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <DefenseBrief entries={entries} />

      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total analyses"
          value={stats.total.toString()}
          icon={<Activity size={14} />}
          tone="sky"
        />
        <KpiCard
          label="Phishing / malicious"
          value={stats.phishy.toString()}
          icon={<ShieldX size={14} />}
          tone="rose"
          sub={
            stats.total > 0
              ? `${Math.round((stats.phishy / stats.total) * 100)}% of total`
              : ""
          }
        />
        <KpiCard
          label="Suspicious"
          value={stats.suspicious.toString()}
          icon={<ShieldAlert size={14} />}
          tone="amber"
        />
        <KpiCard
          label="Safe"
          value={stats.safe.toString()}
          icon={<ShieldCheck size={14} />}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-elev p-5">
          <div className="mb-3 flex items-center gap-2">
            <PieChart size={15} className="text-sky-300" />
            <h3 className="text-sm font-semibold text-slate-100">
              Verdict distribution
            </h3>
          </div>
          <Donut
            slices={[
              { label: "Safe", value: stats.safe, color: VERDICT_COLOR.SAFE },
              {
                label: "Suspicious",
                value: stats.suspicious,
                color: VERDICT_COLOR.SUSPICIOUS,
              },
              {
                label: "Phishing / malicious",
                value: stats.phishy,
                color: VERDICT_COLOR.PHISHING,
              },
            ]}
            total={stats.total}
          />
        </div>

        <div className="surface-elev p-5">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={15} className="text-cyan-300" />
            <h3 className="text-sm font-semibold text-slate-100">
              Risk score histogram
            </h3>
          </div>
          <Histogram buckets={stats.histogram} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-elev p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertOctagon size={15} className="text-rose-300" />
            <h3 className="text-sm font-semibold text-slate-100">
              Top risky senders / hosts
            </h3>
            <span className="text-xs text-slate-500">
              by average risk score
            </span>
          </div>
          {stats.topRisky.length === 0 ? (
            <p className="text-sm text-slate-500">— no risky entries yet —</p>
          ) : (
            <ul className="space-y-2">
              {stats.topRisky.map((row, i) => (
                <li
                  key={row.key + i}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {row.kind === "email" ? (
                    <Mail size={13} className="shrink-0 text-slate-400" />
                  ) : (
                    <Link2 size={13} className="shrink-0 text-slate-400" />
                  )}
                  <span
                    className="min-w-0 flex-1 truncate font-mono text-xs text-slate-200"
                    title={row.key}
                  >
                    {row.key}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    n={row.count}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{
                      backgroundColor: scoreColor(row.avgScore, 0.15),
                      color: scoreColor(row.avgScore, 1),
                    }}
                  >
                    {Math.round(row.avgScore)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-elev p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock size={15} className="text-indigo-300" />
            <h3 className="text-sm font-semibold text-slate-100">Timeline</h3>
            <span className="text-xs text-slate-500">last 25 entries</span>
          </div>
          <ul className="max-h-[300px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (e.kind === "email") onOpenEmail(e.payload);
                    else onOpenUrl(e.payload);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-800/60"
                >
                  <span
                    className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        VERDICT_COLOR[e.verdict as Verdict] ?? "#94a3b8",
                    }}
                  />
                  {e.kind === "email" ? (
                    <Mail size={11} className="text-slate-500" />
                  ) : (
                    <Link2 size={11} className="text-slate-500" />
                  )}
                  <span
                    className="min-w-0 flex-1 truncate text-xs text-slate-200"
                    title={e.label}
                  >
                    {e.label}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-slate-500">
                    {e.riskScore}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {timeAgo(e.timestamp)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type Stats = {
  total: number;
  safe: number;
  suspicious: number;
  phishy: number;
  histogram: number[];
  topRisky: { kind: "email" | "url"; key: string; count: number; avgScore: number }[];
};

function computeStats(entries: HistoryEntry[]): Stats {
  const out: Stats = {
    total: entries.length,
    safe: 0,
    suspicious: 0,
    phishy: 0,
    histogram: new Array(10).fill(0),
    topRisky: [],
  };
  const grouped: Record<string, { kind: "email" | "url"; total: number; count: number }> = {};

  for (const e of entries) {
    if (e.verdict === "SAFE") out.safe += 1;
    else if (e.verdict === "SUSPICIOUS") out.suspicious += 1;
    else out.phishy += 1;

    const bucket = Math.min(9, Math.max(0, Math.floor(e.riskScore / 10)));
    out.histogram[bucket] += 1;

    const groupKey = e.label || "(unknown)";
    if (!grouped[groupKey]) {
      grouped[groupKey] = { kind: e.kind, total: 0, count: 0 };
    }
    grouped[groupKey].total += e.riskScore;
    grouped[groupKey].count += 1;
  }

  out.topRisky = Object.entries(grouped)
    .map(([key, v]) => ({
      kind: v.kind,
      key,
      count: v.count,
      avgScore: v.total / v.count,
    }))
    .filter((r) => r.avgScore >= 20)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 8);

  return out;
}

function KpiCard({
  label,
  value,
  icon,
  sub,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  tone: "sky" | "rose" | "amber" | "emerald";
}) {
  const ring =
    tone === "rose"
      ? "ring-rose-500/30 text-rose-300"
      : tone === "amber"
        ? "ring-amber-500/30 text-amber-300"
        : tone === "emerald"
          ? "ring-emerald-500/30 text-emerald-300"
          : "ring-sky-500/30 text-sky-300";
  return (
    <div className="surface p-4">
      <div className={`inline-flex items-center gap-1.5 ring-1 ring-inset rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ring}`}>
        {icon}
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums text-slate-100">
        {value}
      </div>
      {sub ? <div className="mt-1 text-[11px] text-slate-500">{sub}</div> : null}
    </div>
  );
}

function Donut({
  slices,
  total,
}: {
  slices: { label: string; value: number; color: string }[];
  total: number;
}) {
  const size = 160;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500">No verdicts recorded yet.</p>
    );
  }

  const segments: {
    label: string;
    value: number;
    color: string;
    length: number;
    dashOffset: number;
  }[] = [];
  {
    let cursor = 0;
    for (const s of slices) {
      const length = (s.value / total) * circumference;
      segments.push({ ...s, length, dashOffset: cursor });
      cursor += length;
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={stroke}
          fill="none"
        />
        {segments.map((s, i) =>
          s.value === 0 ? null : (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${s.length} ${circumference}`}
              strokeDashoffset={-s.dashOffset}
            />
          ),
        )}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label} className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-slate-300">{s.label}</span>
              <span className="ml-2 font-mono text-xs tabular-nums text-slate-500">
                {s.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Histogram({ buckets }: { buckets: number[] }) {
  const max = Math.max(1, ...buckets);
  return (
    <div className="grid grid-cols-10 items-end gap-1 h-[160px]">
      {buckets.map((b, i) => {
        const h = (b / max) * 100;
        const tone =
          i <= 2
            ? "bg-emerald-400/70"
            : i <= 6
              ? "bg-amber-400/70"
              : "bg-rose-400/70";
        return (
          <div
            key={i}
            className="flex h-full flex-col items-stretch justify-end"
            title={`${i * 10}–${i * 10 + 9}: ${b}`}
          >
            <span className="text-center text-[10px] tabular-nums text-slate-400">
              {b || ""}
            </span>
            <div
              className={`mt-1 rounded-t-md ${tone} transition-all`}
              style={{ height: `${Math.max(2, h)}%` }}
            />
            <span className="mt-1 text-center text-[9px] text-slate-500">
              {i * 10}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function scoreColor(score: number, alpha: number): string {
  if (score >= 66) return `rgba(251, 113, 133, ${alpha})`;
  if (score >= 26) return `rgba(251, 191, 36, ${alpha})`;
  return `rgba(52, 211, 153, ${alpha})`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}
