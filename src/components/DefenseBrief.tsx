"use client";

import {
  ClipboardCheck,
  ClipboardCopy,
  Loader2,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import type { HistoryEntry } from "@/lib/useHistory";
import { useToast } from "./Toast";

export function DefenseBrief({ entries }: { entries: HistoryEntry[] }) {
  const [text, setText] = useState<string>("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const toast = useToast();

  async function generate() {
    setStreaming(true);
    setError(null);
    setText("");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/defense-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entries: entries.slice(0, 25).map((e) => ({
            label: e.label,
            verdict: e.verdict,
            kind: e.kind,
            riskScore: e.riskScore,
          })),
        }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const chunks: string[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value, { stream: true }));
        setText(chunks.join(""));
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.push({ tone: "success", title: "Defense brief copied" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.push({ tone: "error", title: "Clipboard unavailable" });
    }
  }

  const tooFew = entries.length < 3;

  return (
    <div className="surface-elev p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-cyan-400 text-slate-950">
          <ScrollText size={14} strokeWidth={2.4} />
        </span>
        <h3 className="text-base font-semibold tracking-tight text-slate-100">
          Defense brief
        </h3>
        <span className="text-xs text-muted">
          Personalized 1-page security training, written from your session
        </span>
        <div className="ml-auto flex items-center gap-2">
          {text && !streaming ? (
            <button
              type="button"
              onClick={copyBrief}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                copied
                  ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40"
                  : "border hairline bg-slate-900/60 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {copied ? (
                <>
                  <ClipboardCheck size={12} /> Copied
                </>
              ) : (
                <>
                  <ClipboardCopy size={12} /> Copy
                </>
              )}
            </button>
          ) : null}
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              <Loader2 size={12} className="animate-spin" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={tooFew}
              className="btn-primary py-1.5 px-4 text-xs"
              title={tooFew ? "Analyze at least 3 items first." : ""}
            >
              <Sparkles size={12} />
              {text ? "Regenerate" : "Generate"}
            </button>
          )}
        </div>
      </div>

      {tooFew && !text ? (
        <p className="mt-4 text-sm text-muted">
          Run at least 3 analyses (emails or URLs) and Sentra will write a
          personalized defense brief based on what you saw. Right now you have{" "}
          <strong className="text-slate-200">{entries.length}</strong>.
        </p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      {text || streaming ? (
        <div className="mt-5 prose-tweaks max-h-[520px] overflow-y-auto scrollbar-thin rounded-xl bg-[rgba(2,6,23,0.55)] p-5 ring-1 ring-inset ring-[var(--border)]">
          <MarkdownRenderer text={text} streaming={streaming} />
        </div>
      ) : null}
    </div>
  );
}

/** Tiny Markdown renderer — supports ##, ###, **bold**, *italic*, lists. */
function MarkdownRenderer({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listBuf: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuf.length === 0) return;
    const items = [...listBuf];
    listBuf = [];
    nodes.push(
      <ul key={`ul-${key++}`} className="my-2 ml-4 list-disc space-y-1.5 text-sm leading-relaxed text-slate-200 marker:text-sky-400">
        {items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuf.push(line.slice(2));
      continue;
    }
    flushList();
    if (line.startsWith("### ")) {
      nodes.push(
        <h4
          key={`h4-${key++}`}
          className="mt-4 mb-1 text-sm font-semibold tracking-tight text-slate-100"
        >
          {inline(line.slice(4))}
        </h4>,
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <h3
          key={`h3-${key++}`}
          className="mt-5 mb-2 text-base font-semibold tracking-tight text-slate-50 first:mt-0"
        >
          {inline(line.slice(3))}
        </h3>,
      );
    } else if (line.startsWith("# ")) {
      nodes.push(
        <h2
          key={`h2-${key++}`}
          className="mt-5 mb-2 text-lg font-semibold tracking-tight text-slate-50 first:mt-0"
        >
          {inline(line.slice(2))}
        </h2>,
      );
    } else if (line.length === 0) {
      // paragraph break — handled by flush
    } else {
      nodes.push(
        <p
          key={`p-${key++}`}
          className="my-2 text-sm leading-relaxed text-slate-200"
        >
          {inline(line)}
        </p>,
      );
    }
  }
  flushList();

  return (
    <div>
      {nodes}
      {streaming ? (
        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-sky-400 align-middle" />
      ) : null}
    </div>
  );
}

function inline(s: string): React.ReactNode {
  // **bold**, *italic*, `code`
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < s.length) {
    if (s.startsWith("**", i)) {
      const end = s.indexOf("**", i + 2);
      if (end > -1) {
        out.push(
          <strong key={k++} className="font-semibold text-slate-50">
            {s.slice(i + 2, end)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end > -1) {
        out.push(
          <code
            key={k++}
            className="rounded bg-slate-100/[0.06] px-1 py-0.5 font-mono text-[0.85em] text-slate-100"
          >
            {s.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }
    if (s[i] === "*" && s[i + 1] !== "*") {
      const end = s.indexOf("*", i + 1);
      if (end > -1) {
        out.push(
          <em key={k++} className="italic text-slate-100">
            {s.slice(i + 1, end)}
          </em>,
        );
        i = end + 1;
        continue;
      }
    }
    // Plain text — accumulate
    let j = i;
    while (j < s.length && s[j] !== "*" && s[j] !== "`") j++;
    out.push(s.slice(i, j));
    i = j;
  }
  return out;
}
