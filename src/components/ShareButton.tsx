"use client";

import { Check, ChevronDown, Image as ImageIcon, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { encodeShare } from "@/lib/share";
import type { AnalysisResponse } from "@/lib/types";
import { useToast } from "./Toast";

function encodeCardPayload(data: AnalysisResponse): string {
  const payload = {
    v: data.analysis.verdict,
    s: data.analysis.riskScore,
    sum: data.analysis.summary,
    flags: data.analysis.redFlags.slice(0, 3).map((f) => f.title),
    sender: data.parsed.fromAddress ?? data.parsed.fromHeader ?? "",
    subject: data.parsed.subject ?? "",
    agreement: data.agreement?.label ?? null,
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function ShareButton({
  data,
  rawEmail,
}: {
  data: AnalysisResponse;
  rawEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyLink() {
    try {
      const hash = encodeShare(data, rawEmail);
      const url = `${window.location.origin}${window.location.pathname}#share=${hash}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.push({
        tone: "success",
        title: "Share link copied",
        body: "Anyone with this URL sees the same verdict — no API call needed.",
      });
      window.setTimeout(() => setCopied(false), 2400);
      setOpen(false);
    } catch (e) {
      toast.push({
        tone: "error",
        title: "Share failed",
        body: e instanceof Error ? e.message : "Clipboard unavailable.",
      });
    }
  }

  function downloadImage() {
    try {
      const enc = encodeCardPayload(data);
      const href = `${window.location.origin}/api/verdict-card?d=${enc}`;
      const a = document.createElement("a");
      a.href = href;
      a.download = `sentra-verdict-${data.analysis.verdict.toLowerCase()}.png`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.push({
        tone: "success",
        title: "Verdict card downloading",
        body: "1200×630 PNG · ready to drop into a deck or post.",
      });
      setOpen(false);
    } catch (e) {
      toast.push({
        tone: "error",
        title: "Image download failed",
        body: e instanceof Error ? e.message : "Unknown error.",
      });
    }
  }

  function openCard() {
    const enc = encodeCardPayload(data);
    window.open(`/api/verdict-card?d=${enc}`, "_blank", "noopener");
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Share this verdict"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all ${
          copied
            ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40"
            : "border hairline bg-slate-900/60 text-slate-200 hover:bg-slate-800"
        }`}
      >
        {copied ? (
          <>
            <Check size={12} /> Copied
          </>
        ) : (
          <>
            <Share2 size={12} /> Share
            <ChevronDown
              size={11}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1.5 w-56 origin-top-right surface-elev animate-fade-up overflow-hidden p-1.5 text-xs">
          <MenuItem
            icon={<Link2 size={13} />}
            label="Copy share link"
            sub="Hash-encoded · no server"
            onClick={copyLink}
          />
          <MenuItem
            icon={<ImageIcon size={13} />}
            label="Download verdict PNG"
            sub="1200×630 · for posts &amp; decks"
            onClick={downloadImage}
          />
          <MenuItem
            icon={<ImageIcon size={13} />}
            label="Open card in new tab"
            sub="Preview before sharing"
            onClick={openCard}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-slate-100/[0.05]"
    >
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-slate-100">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted">
          {sub}
        </span>
      </span>
    </button>
  );
}
