/**
 * DMARC (RFC 7489) policy parser. Fetches `_dmarc.<domain>` TXT via DoH
 * and breaks the record into its standard tags.
 */

import { lookupTxt } from "./dns";

export type DmarcPolicy = {
  domain: string;
  raw: string | null;
  found: boolean;
  version: string | null;
  /** Policy for the bare domain (`p=`). */
  p: "none" | "quarantine" | "reject" | null;
  /** Subdomain policy (`sp=`). Falls back to `p` if absent. */
  sp: "none" | "quarantine" | "reject" | null;
  /** Percentage of failing messages the policy is applied to. */
  pct: number | null;
  /** DKIM alignment mode: `s` strict, `r` relaxed. */
  adkim: "s" | "r" | null;
  /** SPF alignment mode. */
  aspf: "s" | "r" | null;
  /** Aggregate report destinations (mailto: URIs). */
  rua: string[];
  /** Forensic report destinations. */
  ruf: string[];
  notes: string[];
};

function parseDmarcRecord(raw: string): Omit<DmarcPolicy, "domain" | "notes"> {
  const out: Omit<DmarcPolicy, "domain" | "notes"> = {
    raw,
    found: true,
    version: null,
    p: null,
    sp: null,
    pct: null,
    adkim: null,
    aspf: null,
    rua: [],
    ruf: [],
  };

  const tags = raw.split(";").map((s) => s.trim()).filter(Boolean);
  for (const t of tags) {
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim().toLowerCase();
    const value = t.slice(eq + 1).trim();
    switch (key) {
      case "v":
        out.version = value;
        break;
      case "p":
        if (value === "none" || value === "quarantine" || value === "reject") {
          out.p = value;
        }
        break;
      case "sp":
        if (value === "none" || value === "quarantine" || value === "reject") {
          out.sp = value;
        }
        break;
      case "pct": {
        const n = parseInt(value, 10);
        if (Number.isFinite(n)) out.pct = Math.max(0, Math.min(100, n));
        break;
      }
      case "adkim":
        if (value === "s" || value === "r") out.adkim = value;
        break;
      case "aspf":
        if (value === "s" || value === "r") out.aspf = value;
        break;
      case "rua":
        out.rua = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "ruf":
        out.ruf = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        break;
    }
  }

  return out;
}

export async function lookupDmarc(domain: string): Promise<DmarcPolicy> {
  const policy: DmarcPolicy = {
    domain,
    raw: null,
    found: false,
    version: null,
    p: null,
    sp: null,
    pct: null,
    adkim: null,
    aspf: null,
    rua: [],
    ruf: [],
    notes: [],
  };

  const txt = await lookupTxt(`_dmarc.${domain}`).catch(() => null);
  if (!txt || txt.records.length === 0) {
    policy.notes.push(`No DMARC record at _dmarc.${domain}.`);
    return policy;
  }

  const record = txt.records
    .map((r) => r.replace(/(^"|"$)/g, "").replace(/"\s+"/g, ""))
    .find((r) => /^v\s*=\s*DMARC1\b/i.test(r.trim()));

  if (!record) {
    policy.notes.push(`TXT exists but no v=DMARC1 record at _dmarc.${domain}.`);
    return policy;
  }

  const parsed = parseDmarcRecord(record);
  Object.assign(policy, parsed);

  if (parsed.p === "none") {
    policy.notes.push(
      "Policy is `p=none` — monitoring mode, receivers won't reject or quarantine.",
    );
  }
  if (parsed.pct !== null && parsed.pct < 100) {
    policy.notes.push(
      `Policy applies to only ${parsed.pct}% of failing messages (pct=${parsed.pct}).`,
    );
  }
  if (parsed.p === null) {
    policy.notes.push("Record present but no `p=` tag — receivers fall back to none.");
  }

  return policy;
}

export function dmarcStrength(p: DmarcPolicy): "good" | "warn" | "bad" {
  if (!p.found) return "bad";
  if (p.p === "reject" && (p.pct === null || p.pct === 100)) return "good";
  if (p.p === "quarantine") return "warn";
  return "bad";
}
