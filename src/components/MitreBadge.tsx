"use client";

import { ExternalLink } from "lucide-react";
import { mitreFor, mitreLink } from "@/lib/mitre";

export function MitreBadge({
  findingId,
  compact,
}: {
  findingId: string;
  compact?: boolean;
}) {
  const ref = mitreFor(findingId);
  if (!ref) return null;
  const href = mitreLink(ref.id);

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={`MITRE ATT&CK · ${ref.id} · ${ref.name} (${ref.tactic})`}
        className="inline-flex items-center gap-1 rounded-md border hairline bg-slate-100/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-300 transition hover:bg-slate-100/[0.08] hover:text-slate-100"
      >
        <span>ATT&amp;CK</span>
        <span className="font-semibold tracking-wider">{ref.id}</span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open MITRE ATT&CK technique ${ref.id} on attack.mitre.org`}
      className="inline-flex items-center gap-1.5 rounded-full border hairline bg-slate-100/[0.04] px-2 py-0.5 font-mono text-[10px] text-slate-300 transition hover:bg-slate-100/[0.08] hover:text-slate-100"
    >
      <span className="text-cyan-300">ATT&amp;CK</span>
      <span className="font-semibold tracking-wider">{ref.id}</span>
      <span className="hidden sm:inline truncate max-w-[160px] text-slate-400">
        {ref.name}
      </span>
      <ExternalLink size={9} className="text-slate-500" />
    </a>
  );
}
