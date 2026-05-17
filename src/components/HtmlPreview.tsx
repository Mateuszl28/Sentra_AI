"use client";

import { Code2, Eye, ShieldAlert } from "lucide-react";
import PostalMime from "postal-mime";
import { useEffect, useMemo, useState } from "react";
import { buildPreviewSrcDoc, sanitizeEmailHtml } from "@/lib/html-preview";

type Tab = "rendered" | "text";

export function HtmlPreview({ rawEmail }: { rawEmail: string }) {
  const [tab, setTab] = useState<Tab>("rendered");
  const [bodyHtml, setBodyHtml] = useState<string | null>(null);
  const [bodyText, setBodyText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    (async () => {
      try {
        const parser = new PostalMime();
        const parsed = await parser.parse(rawEmail);
        if (cancelled) return;
        setBodyHtml(parsed.html || null);
        setBodyText(parsed.text || "");
        setTab(parsed.html ? "rendered" : "text");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Parse failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rawEmail]);

  const srcDoc = useMemo(() => {
    if (!bodyHtml) return null;
    return buildPreviewSrcDoc(sanitizeEmailHtml(bodyHtml));
  }, [bodyHtml]);

  const hasHtml = !!bodyHtml;

  return (
    <section className="surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Eye size={15} className="text-cyan-300" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          Rendered preview
        </h3>
        <span className="text-xs text-muted">
          how the email would look to a victim · scripts &amp; trackers stripped
        </span>
        <div className="ml-auto inline-flex items-center rounded-full bg-slate-950/60 p-0.5 ring-1 ring-inset ring-[var(--border)]">
          <TabBtn
            active={tab === "rendered"}
            onClick={() => setTab("rendered")}
            disabled={!hasHtml}
            icon={<Eye size={11} />}
            label="Rendered"
          />
          <TabBtn
            active={tab === "text"}
            onClick={() => setTab("text")}
            icon={<Code2 size={11} />}
            label="Plain text"
          />
        </div>
      </div>

      <div className="rounded-xl border hairline-strong bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200">
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert size={11} />
          <strong className="font-semibold">Sandboxed.</strong> Scripts can&apos;t
          run, links are disabled, images are blocked so the sender can&apos;t
          beacon your IP. Hover any link to see its real URL.
        </span>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted">Parsing…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-rose-300">{error}</p>
      ) : tab === "rendered" && srcDoc ? (
        <iframe
          title="Rendered email preview"
          srcDoc={srcDoc}
          sandbox=""
          referrerPolicy="no-referrer"
          className="mt-3 h-[480px] w-full rounded-xl bg-slate-100 ring-1 ring-inset ring-[var(--border)]"
        />
      ) : tab === "rendered" && !srcDoc ? (
        <p className="mt-3 text-sm text-muted">
          This email has no HTML body — only plain text.
        </p>
      ) : (
        <pre className="mt-3 max-h-[480px] overflow-auto scrollbar-thin whitespace-pre-wrap break-words rounded-xl bg-[rgba(2,6,23,0.65)] p-4 font-mono text-[11.5px] leading-[1.6] text-slate-200 ring-1 ring-inset ring-[var(--border)]">
          {bodyText || "(empty body)"}
        </pre>
      )}
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  disabled,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
        active
          ? "bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950"
          : "text-slate-300 hover:text-slate-100"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}
