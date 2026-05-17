"use client";

import { Loader2, MessageCircle, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AnalysisResponse } from "@/lib/types";

type ChatMsg = { role: "user" | "model"; text: string };

const QUICK_QUESTIONS = [
  "Why exactly is this phishing?",
  "Explain SPF / DKIM / DMARC like I'm five",
  "What would a real version of this email look like?",
  "Could a more careful reader still fall for this?",
  "What should I do if I already clicked the link?",
];

function buildAnalysisSummary(data: AnalysisResponse): string {
  const a = data.analysis;
  const lines: string[] = [];
  lines.push(`Verdict: ${a.verdict} (risk score ${a.riskScore}/100)`);
  lines.push(`Summary: ${a.summary}`);
  if (a.redFlags.length > 0) {
    lines.push("Red flags:");
    for (const f of a.redFlags) {
      lines.push(
        `- [${f.severity}] ${f.title} — ${f.explanation}${
          f.evidence ? ` (evidence: ${f.evidence})` : ""
        }`,
      );
    }
  }
  if (a.legitimateSignals.length > 0) {
    lines.push(`Legitimate signals: ${a.legitimateSignals.join("; ")}`);
  }
  if (a.recommendedActions.length > 0) {
    lines.push(`Recommended actions: ${a.recommendedActions.join("; ")}`);
  }
  lines.push(`Educational takeaway: ${a.educationalTakeaway}`);
  if (data.heuristicFindings.length > 0) {
    lines.push("Deterministic heuristics that fired:");
    for (const h of data.heuristicFindings) {
      lines.push(`- [${h.severity}] ${h.title} — ${h.detail}`);
    }
  }
  return lines.join("\n");
}

export function FollowUpChat({
  data,
  rawEmail,
}: {
  data: AnalysisResponse;
  rawEmail: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset when a fresh analysis comes in
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    /* eslint-disable react-hooks/set-state-in-effect */
    setMessages([]);
    setInput("");
    setError(null);
    setStreaming(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [data]);

  async function send(text?: string) {
    const userMessage = (text ?? input).trim();
    if (!userMessage || streaming) return;

    setInput("");
    setError(null);
    setStreaming(true);
    const next: ChatMsg[] = [
      ...messages,
      { role: "user", text: userMessage },
      { role: "model", text: "" },
    ];
    setMessages(next);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rawEmail,
          analysisSummary: buildAnalysisSummary(data),
          history: messages,
          message: userMessage,
        }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const chunks: string[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value, { stream: true }));
        const joined = chunks.join("");
        setMessages((curr) => {
          const copy = [...curr];
          const last = copy[copy.length - 1];
          if (last && last.role === "model") {
            copy[copy.length - 1] = { role: "model", text: joined };
          }
          return copy;
        });
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Chat failed.";
      setError(msg);
      setMessages((curr) => {
        const copy = [...curr];
        if (copy[copy.length - 1]?.role === "model" && !copy[copy.length - 1].text) {
          copy.pop();
        }
        return copy;
      });
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

  const hasConversation = messages.length > 0;

  return (
    <div className="surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MessageCircle size={16} className="text-cyan-400" />
        <h3 className="text-sm font-semibold tracking-tight text-slate-100">
          Ask follow-up questions
        </h3>
        <span className="text-xs text-slate-500">
          Gemini answers grounded in this specific email
        </span>
      </div>

      <div
        ref={logRef}
        className={`scrollbar-thin space-y-3 overflow-y-auto pr-1 transition-all ${
          hasConversation ? "max-h-[420px] pb-1" : "max-h-0"
        }`}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              m.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                m.role === "user"
                  ? "bg-sky-500/20 text-sky-300"
                  : "bg-cyan-500/15 text-cyan-300"
              }`}
            >
              {m.role === "user" ? (
                <User size={13} />
              ) : (
                <Sparkles size={13} />
              )}
            </div>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-sky-500/10 text-slate-100 ring-1 ring-inset ring-sky-500/30"
                  : "bg-slate-950/60 text-slate-200 ring-1 ring-inset ring-slate-800"
              }`}
            >
              {m.text || (
                <span className="inline-flex items-center gap-2 text-slate-500">
                  <Loader2 size={12} className="animate-spin" /> thinking…
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!hasConversation ? (
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={streaming}
              className="rounded-full bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-inset ring-slate-700 transition hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={streaming}
          rows={1}
          placeholder="Ask anything about this email…"
          spellCheck={false}
          className="block min-h-[42px] flex-1 resize-none rounded-2xl bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none ring-1 ring-inset ring-slate-800/80 focus:ring-cyan-500/60 disabled:opacity-60"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            <Loader2 size={14} className="animate-spin" /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => send()}
            disabled={!input.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
          >
            <Send size={14} /> Send
          </button>
        )}
      </div>
    </div>
  );
}
