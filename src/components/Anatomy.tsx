"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SAMPLE_EMAIL = `Authentication-Results: mx.recipient.com; spf=fail smtp.mailfrom=paypal-secure-help.com; dkim=none; dmarc=fail
Return-Path: <noreply@paypal-secure-help.com>
From: "PayPal Service" <support@paypal-secure-help.com>
Reply-To: paypal-team@protonmail.com
To: <you@recipient.com>
Subject: URGENT: Your PayPal account has been limited - Action required within 24 hours
Date: Mon, 12 May 2026 09:14:21 +0000
Content-Type: text/html; charset="UTF-8"

<html><body style="font-family:Arial">
  <p>Dear Customer,</p>
  <p>We detected unusual sign-in activity on your PayPal account from an unrecognized device.
  For your protection, your account has been temporarily <b>limited</b>.</p>
  <p>You must <b>verify your identity within 24 hours</b> or your account will be permanently suspended
  and any pending balance will be forfeited.</p>
  <p><a href="http://paypal-secure-help.com@198.51.100.42/login.php">https://www.paypal.com/signin</a></p>
  <p>If you do not respond, legal action may be taken to recover any outstanding amounts.</p>
  <p>Sincerely,<br/>PayPal Security Team</p>
</body></html>`;

type Step = {
  id: string;
  title: string;
  category: "header" | "sender" | "link" | "content";
  needle: string;
  explanation: string;
  takeaway: string;
};

const STEPS: Step[] = [
  {
    id: "auth-results",
    title: "SPF fail + DMARC fail in Authentication-Results",
    category: "header",
    needle: "spf=fail smtp.mailfrom=paypal-secure-help.com; dkim=none; dmarc=fail",
    explanation:
      "Your provider already told you the sender failed every authentication check. SPF says the SMTP server isn't authorized to send for paypal-secure-help.com. DKIM is missing entirely. DMARC fails because there's no aligned, authenticated identity.",
    takeaway:
      "The Authentication-Results header is your free phishing detector. Read it first.",
  },
  {
    id: "from-domain",
    title: "Sender domain isn't PayPal",
    category: "sender",
    needle: "support@paypal-secure-help.com",
    explanation:
      "Brand-name in the address bar but a hyphenated, freshly-registered domain. PayPal sends from paypal.com, full stop. Attackers stuff the brand into a longer host hoping you stop reading at 'paypal'.",
    takeaway:
      "Read domains right-to-left. The part just before the TLD is what matters.",
  },
  {
    id: "reply-to",
    title: "Reply-To hops to a free webmail",
    category: "sender",
    needle: "Reply-To: paypal-team@protonmail.com",
    explanation:
      "Even if a victim hits Reply, they don't reach the company — they reach a disposable proton.me mailbox. Real corporate mail has Reply-To on the same domain as From.",
    takeaway:
      "From and Reply-To should agree. When they don't, someone wants your reply elsewhere.",
  },
  {
    id: "subject",
    title: "Subject screams urgency + deadline",
    category: "content",
    needle: "URGENT: Your PayPal account has been limited - Action required within 24 hours",
    explanation:
      "All-caps URGENT, a manufactured deadline, the word 'limited'. Phishers manufacture time pressure so you act before thinking. Real account actions don't usually have a 24-hour countdown.",
    takeaway:
      "When an email creates panic, the right move is to slow down — open a fresh browser tab and log in directly.",
  },
  {
    id: "credential-bait",
    title: "Asks you to 'verify' to keep access",
    category: "content",
    needle: "verify your identity within 24 hours",
    explanation:
      "The threat-and-reward pattern: comply or lose your account. The 'verification' is the credential capture. Real lockouts route you to a known web app, not to a one-time email link.",
    takeaway:
      "Companies never email you a verification link with a countdown.",
  },
  {
    id: "anchor-mismatch",
    title: "Link text vs. real href — total mismatch",
    category: "link",
    needle: "https://www.paypal.com/signin",
    explanation:
      "The blue clickable text says paypal.com/signin. Hover the link and the actual destination is something entirely different. The real address is in the next step.",
    takeaway:
      "Always hover before clicking. Better: never click — type the address yourself.",
  },
  {
    id: "at-trick",
    title: "@-trick hides the destination",
    category: "link",
    needle: "http://paypal-secure-help.com@198.51.100.42/login.php",
    explanation:
      "Everything before the @ in a URL is credentials and is ignored by browsers. This link actually goes to 198.51.100.42 — a bare IP. The 'paypal-secure-help.com' is window dressing.",
    takeaway:
      "If a URL contains @ after the protocol, the real host is whatever comes after.",
  },
  {
    id: "threat-language",
    title: "Closes with a legal threat",
    category: "content",
    needle: "legal action may be taken",
    explanation:
      "Threats of legal action over an unverified account are pure intimidation. Real legal notices arrive on paper from named law firms, not in HTML email.",
    takeaway:
      "Vague legal threats by email are an intimidation tactic, not a real notice.",
  },
];

const CATEGORY_COLOR: Record<Step["category"], string> = {
  header: "from-cyan-400 to-sky-400",
  sender: "from-fuchsia-400 to-rose-400",
  link: "from-amber-400 to-rose-400",
  content: "from-emerald-400 to-cyan-400",
};

const CATEGORY_PILL: Record<Step["category"], string> = {
  header: "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30",
  sender: "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30",
  link: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  content: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
};

export function Anatomy({
  onSendToAnalyzer,
}: {
  onSendToAnalyzer?: (raw: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(new Set([STEPS[0].id]));
  const finished = step === STEPS.length;

  useEffect(() => {
    if (!finished) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeen((s) => new Set(s).add(STEPS[step].id));
    }
  }, [step, finished]);

  const segments = useMemo(
    () => splitHighlighted(SAMPLE_EMAIL, finished ? null : STEPS[step]?.needle),
    [step, finished],
  );

  function next() {
    setStep((s) => Math.min(STEPS.length, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }
  function reset() {
    setStep(0);
    setSeen(new Set([STEPS[0].id]));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="surface-elev p-1.5">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-2 font-mono tracking-tight">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="ml-2">PayPal phishing · annotated</span>
          </span>
          <span className="font-mono tabular-nums">
            step {Math.min(step + 1, STEPS.length)}/{STEPS.length}
          </span>
        </div>
        <pre className="max-h-[560px] overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-2xl bg-slate-950/60 p-4 font-mono text-[11.5px] leading-[1.6] text-slate-300">
          {segments.map((seg, i) =>
            seg.highlight ? (
              <mark
                key={i}
                className="rounded-md bg-amber-400/20 px-1 py-0.5 text-amber-100 ring-1 ring-inset ring-amber-400/40 shadow-[0_0_18px_-4px_rgba(251,191,36,0.6)]"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </pre>
      </div>

      <div className="grid content-start gap-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-500"
            style={{
              width: `${Math.min(100, ((step + (finished ? 0 : 1)) / STEPS.length) * 100)}%`,
            }}
          />
        </div>

        {finished ? (
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-6">
            <CheckCircle2 size={28} className="text-emerald-300" />
            <h3 className="mt-3 text-xl font-semibold text-slate-100">
              Eight tricks, one email
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              You just walked through how a single phishing message stacks
              header, sender, link and content attacks — each weak on its own,
              devastating together.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {onSendToAnalyzer ? (
                <button
                  type="button"
                  onClick={() => onSendToAnalyzer(SAMPLE_EMAIL)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110"
                >
                  <Sparkles size={14} /> Run full Sentra analysis
                </button>
              ) : null}
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <RotateCcw size={13} /> Walk through again
              </button>
            </div>
          </div>
        ) : (
          <div className="surface-elev p-5">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${CATEGORY_PILL[STEPS[step].category]}`}
            >
              <BookOpen size={11} /> {STEPS[step].category}
            </div>
            <h3
              className={`mt-2 bg-gradient-to-r ${CATEGORY_COLOR[STEPS[step].category]} bg-clip-text text-base font-semibold leading-tight text-transparent`}
            >
              {STEPS[step].title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {STEPS[step].explanation}
            </p>
            <p className="mt-3 text-xs italic text-slate-400">
              <strong className="not-italic text-slate-300">Takeaway:</strong>{" "}
              {STEPS[step].takeaway}
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ArrowLeft size={12} /> Prev
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:brightness-110"
              >
                {step === STEPS.length - 1 ? "Finish" : "Next"}{" "}
                <ArrowRight size={12} />
              </button>
              <span className="ml-auto text-[11px] text-slate-500">
                {seen.size}/{STEPS.length} seen
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              title={s.title}
              className={`group rounded-lg px-2 py-1.5 text-left text-[10px] font-mono uppercase tracking-wider transition ${
                i === step
                  ? "bg-slate-800 text-slate-100 ring-1 ring-inset ring-slate-700"
                  : seen.has(s.id)
                    ? "bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                    : "bg-slate-900/30 text-slate-500 hover:text-slate-300"
              }`}
            >
              <span
                className="inline-flex h-1.5 w-1.5 rounded-full mr-1"
                style={{
                  backgroundColor:
                    s.category === "header"
                      ? "#22d3ee"
                      : s.category === "sender"
                        ? "#e879f9"
                        : s.category === "link"
                          ? "#fbbf24"
                          : "#34d399",
                }}
              />
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function splitHighlighted(
  source: string,
  needle: string | null,
): { text: string; highlight: boolean }[] {
  if (!needle) return [{ text: source, highlight: false }];
  const idx = source.indexOf(needle);
  if (idx === -1) return [{ text: source, highlight: false }];
  return [
    { text: source.slice(0, idx), highlight: false },
    { text: needle, highlight: true },
    { text: source.slice(idx + needle.length), highlight: false },
  ];
}
