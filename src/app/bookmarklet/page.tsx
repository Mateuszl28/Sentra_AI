"use client";

import {
  ArrowUpRight,
  BookmarkPlus,
  CircleCheck,
  Eye,
  MousePointer2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * Generated at runtime so the bookmarklet always points back at the host
 * that served this page (works on localhost, preview deploys, prod).
 */
function buildBookmarkletJs(targetOrigin: string): string {
  return `javascript:(function(){try{var t=(document.body&&(document.body.innerText||document.body.textContent))||'';var s=(document.querySelector('h1,[role=heading]')||{}).innerText||document.title||'';var raw=t.length>200?t:('Subject: '+s+String.fromCharCode(10,10)+t);if(raw.length>30000){raw=raw.slice(0,30000)}var b=btoa(unescape(encodeURIComponent(raw))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');window.open('${targetOrigin}/?prefill='+b,'_blank','noopener')}catch(e){alert('Sentra bookmarklet failed: '+e.message)}})();`;
}

export default function BookmarkletPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const js = useMemo(
    () => buildBookmarkletJs(origin || "https://sentra-ai.vercel.app"),
    [origin],
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="grid gap-4 text-center animate-fade-up">
        <div className="kicker mx-auto">
          <BookmarkPlus size={11} /> One-click triage from your inbox
        </div>
        <h1 className="text-balance text-[2.4rem] font-semibold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl">
          Send any suspicious email to{" "}
          <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
            Sentra in one click.
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-[15px] leading-relaxed text-slate-300">
          Drag the button below to your bookmarks bar. When you spot a sketchy
          email — open it, hit the bookmarklet, and Sentra opens in a new tab
          with the full content pre-pasted, ready to analyze.
        </p>
      </header>

      <section className="surface-elev animate-fade-up p-8 text-center">
        <p className="kicker mb-3 justify-center">drag-me-to-bookmarks</p>
        <a
          href={js}
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_18px_50px_-18px_rgba(56,189,248,0.6)] transition hover:brightness-110"
          draggable
          title="Drag me to your bookmarks bar"
        >
          <ShieldCheck size={18} strokeWidth={2.6} />
          Send to Sentra
        </a>
        <p className="mt-4 text-xs text-muted">
          Browsers won&apos;t let JavaScript create bookmarks programmatically —
          this has to be a manual drag.
        </p>
      </section>

      <section className="grid gap-4 animate-fade-up">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">
          How to install
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <Step
            n={1}
            icon={<Eye size={14} />}
            title="Show your bookmarks bar"
            body={
              <>
                Chrome/Edge: <kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">Shift</kbd>+<kbd className="kbd">B</kbd>.
                Firefox: <em>View → Toolbars → Bookmarks Toolbar</em>.
              </>
            }
          />
          <Step
            n={2}
            icon={<MousePointer2 size={14} />}
            title="Drag the blue button"
            body="Click and hold the gradient Send to Sentra button above, then drop it onto your bookmarks bar."
          />
          <Step
            n={3}
            icon={<CircleCheck size={14} />}
            title="Click it on any page"
            body="On a Gmail message, an Outlook thread, a Slack copy-paste — the bookmarklet grabs the visible text and opens Sentra with it loaded."
          />
        </ol>
      </section>

      <section className="surface animate-fade-up p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">
            Pro tip — Gmail&apos;s <em>Show original</em>
          </h3>
          <span className="text-xs text-muted">
            unlocks SPF/DKIM/DMARC + Received chain
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          The bookmarklet captures whatever text is visible on the page. To get
          the <em>full</em> Sentra analysis with header forensics, open the
          suspicious email in Gmail, click the three-dot menu →{" "}
          <strong>Show original</strong>, then click the bookmarklet on
          that page. Sentra will receive the raw RFC-822 message including
          every <code className="rounded bg-slate-100/[0.06] px-1 py-0.5 font-mono text-[0.85em]">Received:</code>{" "}
          hop and <code className="rounded bg-slate-100/[0.06] px-1 py-0.5 font-mono text-[0.85em]">Authentication-Results</code>{" "}
          header.
        </p>
      </section>

      <section className="surface animate-fade-up p-5">
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          Source — nothing magic, view what runs
        </h3>
        <p className="mt-2 text-xs text-muted">
          Captures <code className="font-mono">document.body.innerText</code>,
          base64-url encodes it, opens Sentra with{" "}
          <code className="font-mono">?prefill=…</code>. Never sends to any
          third party. No telemetry. Truncates at 30 000 chars.
        </p>
        <pre className="mt-3 max-h-48 overflow-auto scrollbar-thin whitespace-pre-wrap break-all rounded-lg bg-[rgba(2,6,23,0.65)] p-3 font-mono text-[11px] leading-relaxed text-slate-300 ring-1 ring-inset ring-[var(--border)]">
          {js}
        </pre>
      </section>

      <div className="flex items-center justify-between text-xs text-muted">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-slate-200"
        >
          <ArrowUpRight size={11} className="rotate-180" />
          Back to the workbench
        </Link>
        <span>Stays on this device · no analytics</span>
      </div>
    </main>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-bold text-sky-300 ring-1 ring-inset ring-sky-400/30">
          {n}
        </span>
        <span className="text-slate-400">{icon}</span>
        <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
    </div>
  );
}
