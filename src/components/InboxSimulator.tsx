"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Inbox,
  Mail,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EXAMPLES, type EmailExample } from "@/lib/examples";

type InboxItem = {
  id: string;
  fromName: string;
  fromAddress: string;
  subject: string;
  preview: string;
  receivedLabel: string;
  isPhishing: boolean;
  example: EmailExample;
};

type Decision = "report" | "trash" | "keep";

type Action = {
  id: string;
  decision: Decision;
  correct: boolean;
};

const FROM_FALLBACK_NAMES: Record<string, string> = {
  "paypal-classic": "PayPal Service",
  "ceo-fraud": "Anna Kowalska - CEO",
  "microsoft-365": "Microsoft 365 Team",
  "shipping-malware": "DHL Express",
  "apple-id-lock": "Apple Support",
  "payroll-redirect": "Michael Brown",
  "mfa-fatigue": "Microsoft Authenticator",
  "invoice-attachment": "Accounts Receivable",
  "linkedin-clone": "LinkedIn",
  "legit-github": "GitHub",
  "legit-stripe": "Stripe",
};

const PREVIEWS: Record<string, string> = {
  "paypal-classic":
    "Dear Customer, We detected unusual sign-in activity on your PayPal account…",
  "ceo-fraud":
    "Hi, Are you available? I'm in a meeting and cannot make calls. I need you to take care of something for me ASAP…",
  "microsoft-365":
    "Hello user, Your Office 365 mailbox storage is 99% full. Incoming messages will start bouncing unless…",
  "shipping-malware":
    "Dear Customer, We attempted to deliver your parcel today but no one was available at the address…",
  "apple-id-lock":
    "Dear Customer, We detected a sign-in attempt to your Apple ID from an unrecognized iPhone 15 in Lagos…",
  "payroll-redirect":
    "Hi, I switched banks recently and would like to update my direct deposit details before Friday's payroll run…",
  "mfa-fatigue":
    "A sign-in to your Microsoft account is waiting for approval. App: Microsoft 365 · Device: Windows 11…",
  "invoice-attachment":
    "Hello, Our records show invoice INV-0042118 for $4,820.00 is still outstanding and is now 14 days past due…",
  "linkedin-clone":
    "Hi, 24 people searched for you on LinkedIn this week — that's more than 80% of users in your network…",
  "legit-github":
    "Hi @mateuszl28, A new SSH key was added to your account. Key fingerprint: SHA256:Wq8u…7nXk · Title: laptop-2026…",
  "legit-stripe":
    "Receipt from Acme, Inc. Amount paid: $24.00 · Date paid: May 15, 2026 · Payment method: Visa •••• 4242…",
};

const TIME_LABELS = [
  "now",
  "2 min",
  "8 min",
  "12 min",
  "26 min",
  "1 h",
  "1 h",
  "2 h",
  "3 h",
  "yesterday",
  "yesterday",
  "Wed",
];

function getFromAddress(raw: string): string {
  const m = raw.match(/^From:\s*(.+)$/m);
  if (!m) return "(unknown)";
  const v = m[1].trim();
  const angle = v.match(/<([^>]+)>/);
  return angle ? angle[1] : v;
}

function getSubject(raw: string): string {
  const m = raw.match(/^Subject:\s*(.+)$/m);
  return m ? m[1].trim() : "(no subject)";
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildInbox(): InboxItem[] {
  const items = EXAMPLES.map((ex, i) => {
    const fromName =
      FROM_FALLBACK_NAMES[ex.id] ?? ex.label.split(" ")[0] ?? "Sender";
    return {
      id: ex.id,
      fromName,
      fromAddress: getFromAddress(ex.raw),
      subject: getSubject(ex.raw),
      preview: PREVIEWS[ex.id] ?? "(no preview)",
      receivedLabel: TIME_LABELS[i % TIME_LABELS.length],
      isPhishing: ex.expected !== "SAFE",
      example: ex,
    };
  });
  return shuffle(items);
}

export function InboxSimulator({
  onSendToAnalyzer,
}: {
  onSendToAnalyzer?: (raw: string) => void;
}) {
  const [inbox, setInbox] = useState<InboxItem[]>(() => buildInbox());
  const [actions, setActions] = useState<Record<string, Action>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => inbox.find((i) => i.id === selectedId) ?? null,
    [inbox, selectedId],
  );

  const finished =
    inbox.length > 0 && Object.keys(actions).length === inbox.length;

  const score = useMemo(() => {
    let correct = 0;
    for (const a of Object.values(actions)) if (a.correct) correct += 1;
    return { correct, total: Object.keys(actions).length };
  }, [actions]);

  function act(item: InboxItem, decision: Decision) {
    const correctDecision: Decision = item.isPhishing ? "report" : "keep";
    const correct = decision === correctDecision;
    setActions((a) => ({
      ...a,
      [item.id]: { id: item.id, decision, correct },
    }));
    setSelectedId(null);
  }

  function reset() {
    setInbox(buildInbox());
    setActions({});
    setSelectedId(null);
  }

  if (finished) {
    const pct =
      score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const verdict =
      pct === 100
        ? "Flawless triage. Hire this human."
        : pct >= 80
          ? "Strong — you'd survive a real Monday inbox."
          : pct >= 50
            ? "Mixed. Review the misses below before next round."
            : "Phishers had a field day. Run it again.";
    return (
      <div className="grid gap-6">
        <div className="surface-elev p-8 text-center">
          <Trophy size={36} className="mx-auto text-amber-300" />
          <h2 className="mt-3 text-2xl font-semibold text-slate-100">
            {score.correct}/{score.total} correct · {pct}%
          </h2>
          <p className="mt-2 text-sm text-slate-300">{verdict}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:brightness-110"
          >
            <RotateCcw size={14} /> New inbox
          </button>
        </div>

        <div className="grid gap-3">
          <h3 className="text-sm font-semibold text-slate-200">
            Round summary
          </h3>
          <ul className="space-y-2">
            {inbox.map((item) => {
              const a = actions[item.id];
              return (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                    a?.correct
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  {a?.correct ? (
                    <CheckCircle2 size={16} className="text-emerald-300" />
                  ) : (
                    <XCircle size={16} className="text-rose-300" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-100">
                      {item.subject}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {item.fromName} ·{" "}
                      <span className="font-mono">{item.fromAddress}</span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      item.isPhishing
                        ? "bg-rose-500/20 text-rose-200"
                        : "bg-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    {item.isPhishing ? "Phishing" : "Legit"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    you chose{" "}
                    <strong className="text-slate-300">{a?.decision}</strong>
                  </span>
                  {onSendToAnalyzer ? (
                    <button
                      type="button"
                      onClick={() => onSendToAnalyzer(item.example.raw)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                    >
                      <Sparkles size={11} /> Analyze
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  if (selected) {
    const wasPhish = selected.isPhishing;
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft size={13} /> Back to inbox
          </button>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Decide without clicking any link
          </span>
        </div>

        <div className="surface-elev p-1.5">
          <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 text-[11px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="ml-2 font-mono tracking-tight">
              raw message — your call
            </span>
          </div>
          <pre className="max-h-[460px] overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-4 font-mono text-[11.5px] leading-[1.55] text-slate-300">
            {selected.example.raw}
          </pre>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <DecisionButton
            tone="danger"
            icon={<ShieldFlag />}
            label="Report phishing"
            sub="It's a scam — get it out of inboxes"
            onClick={() => act(selected, "report")}
          />
          <DecisionButton
            tone="warn"
            icon={<Trash2 size={14} />}
            label="Trash"
            sub="Junk / promo, but not malicious"
            onClick={() => act(selected, "trash")}
          />
          <DecisionButton
            tone="safe"
            icon={<Star size={14} />}
            label="Keep"
            sub="Legit and important"
            onClick={() => act(selected, "keep")}
          />
        </div>

        {/* hidden helper — surfaces the answer only inside reasoning, never to the user */}
        <span className="sr-only" aria-hidden>
          {wasPhish ? "phish" : "legit"}
        </span>
      </div>
    );
  }

  const unprocessed = inbox.filter((i) => !actions[i.id]).length;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <Inbox size={13} className="text-emerald-400" />
          <span className="font-mono uppercase tracking-[0.18em]">
            Inbox · {inbox.length} messages · {unprocessed} to process
          </span>
        </span>
        <span className="font-mono tabular-nums">
          Score {score.correct}/{score.total}
        </span>
      </div>

      <div className="overflow-hidden surface-elev">
        <ul className="divide-y divide-slate-800">
          {inbox.map((item) => {
            const a = actions[item.id];
            const processed = !!a;
            return (
              <li
                key={item.id}
                className={`group flex items-center gap-3 px-4 py-3 transition-colors ${
                  processed
                    ? "opacity-60"
                    : "cursor-pointer hover:bg-slate-900/70"
                }`}
                onClick={() => !processed && setSelectedId(item.id)}
              >
                <Mail
                  size={14}
                  className={
                    processed ? "text-slate-600" : "text-sky-400"
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`truncate text-sm font-semibold ${
                        processed ? "text-slate-400" : "text-slate-100"
                      }`}
                    >
                      {item.fromName}
                    </span>
                    <span className="truncate font-mono text-[10px] text-slate-500">
                      &lt;{item.fromAddress}&gt;
                    </span>
                  </div>
                  <div
                    className={`truncate text-sm ${
                      processed ? "text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {item.subject}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {item.preview}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="text-[11px] tabular-nums text-slate-500">
                    {item.receivedLabel}
                  </span>
                  {a ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        a.correct
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {a.correct ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <XCircle size={11} />
                      )}
                      {a.decision}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Click a message to open it and decide.</span>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
        >
          <RotateCcw size={11} /> Shuffle inbox
        </button>
      </div>
    </div>
  );
}

function DecisionButton({
  tone,
  icon,
  label,
  sub,
  onClick,
}: {
  tone: "danger" | "warn" | "safe";
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  const ring =
    tone === "danger"
      ? "border-rose-500/30 hover:border-rose-400/60"
      : tone === "warn"
        ? "border-amber-500/30 hover:border-amber-400/60"
        : "border-emerald-500/30 hover:border-emerald-400/60";
  const iconBg =
    tone === "danger"
      ? "bg-rose-500/15 text-rose-300"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-300"
        : "bg-emerald-500/15 text-emerald-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start rounded-2xl border bg-slate-900/40 p-4 text-left transition-all hover:bg-slate-900/70 ${ring}`}
    >
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}
      >
        {icon}
      </span>
      <span className="mt-2 text-sm font-semibold text-slate-100">{label}</span>
      <span className="mt-0.5 text-xs text-slate-400">{sub}</span>
    </button>
  );
}

function ShieldFlag() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2.5 4 5.5v6.4c0 4.6 3.3 8.9 8 9.6 4.7-.7 8-5 8-9.6V5.5l-8-3Z" />
      <path d="m9 12 6 0M12 9v6" />
    </svg>
  );
}
