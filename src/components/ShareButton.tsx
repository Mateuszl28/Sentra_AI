"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { encodeShare } from "@/lib/share";
import type { AnalysisResponse } from "@/lib/types";

export function ShareButton({
  data,
  rawEmail,
}: {
  data: AnalysisResponse;
  rawEmail: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setError(null);
    try {
      const hash = encodeShare(data, rawEmail);
      const url = `${window.location.origin}${window.location.pathname}#share=${hash}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share failed.");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={share}
        title="Copy a shareable link encoding the verdict (no server needed)"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all ${
          copied
            ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40"
            : "bg-slate-900/60 text-slate-200 ring-slate-700 hover:bg-slate-800"
        }`}
      >
        {copied ? (
          <>
            <Check size={12} /> Link copied
          </>
        ) : (
          <>
            <Share2 size={12} /> Share verdict
          </>
        )}
      </button>
      {error ? (
        <div className="absolute right-0 mt-1 whitespace-nowrap rounded-md bg-rose-500/10 px-2 py-1 text-[10px] text-rose-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
