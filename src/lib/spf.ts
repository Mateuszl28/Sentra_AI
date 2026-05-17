/**
 * SPF (RFC 7208) policy parser. Fetches the apex TXT for a domain via
 * Cloudflare DoH, finds the `v=spf1` record, and breaks it into
 * mechanisms + qualifier + suffix policy.
 *
 * We don't *evaluate* SPF (would require resolving every include/a/mx and
 * tracking the connecting IP) — but parsing the policy is already enough
 * to surface common phishing-domain tells:
 *
 *   - No SPF record at all
 *   - SPF terminates with +all (allows every IP — practically open)
 *   - SPF uses ?all (neutral, no policy)
 *   - SPF lacks any include= and any ip4=/ip6= (defaulted to a/mx only)
 */

import { lookupTxt } from "./dns";

export type SpfQualifier = "+" | "-" | "~" | "?";

export type SpfMechanism = {
  qualifier: SpfQualifier;
  kind:
    | "all"
    | "ip4"
    | "ip6"
    | "a"
    | "mx"
    | "ptr"
    | "exists"
    | "include"
    | "redirect"
    | "exp"
    | "unknown";
  value: string | null;
  raw: string;
};

export type SpfPolicy = {
  domain: string;
  raw: string | null;
  found: boolean;
  mechanisms: SpfMechanism[];
  /** The `all` qualifier at the policy tail. */
  allQualifier: SpfQualifier | null;
  includes: string[];
  notes: string[];
};

function parseMechanism(token: string): SpfMechanism {
  const raw = token;
  let q: SpfQualifier = "+";
  let body = token;
  if (token.startsWith("-") || token.startsWith("~") || token.startsWith("+") || token.startsWith("?")) {
    q = token[0] as SpfQualifier;
    body = token.slice(1);
  }
  const colon = body.indexOf(":");
  const eq = body.indexOf("=");
  const sepIdx = colon === -1 ? eq : eq === -1 ? colon : Math.min(colon, eq);
  const key = sepIdx === -1 ? body : body.slice(0, sepIdx);
  const value = sepIdx === -1 ? null : body.slice(sepIdx + 1);

  const lc = key.toLowerCase();
  const knownKinds: SpfMechanism["kind"][] = [
    "all",
    "ip4",
    "ip6",
    "a",
    "mx",
    "ptr",
    "exists",
    "include",
    "redirect",
    "exp",
  ];
  const kind = (knownKinds as string[]).includes(lc)
    ? (lc as SpfMechanism["kind"])
    : "unknown";

  return { qualifier: q, kind, value, raw };
}

export async function lookupSpf(domain: string): Promise<SpfPolicy> {
  const policy: SpfPolicy = {
    domain,
    raw: null,
    found: false,
    mechanisms: [],
    allQualifier: null,
    includes: [],
    notes: [],
  };

  const txt = await lookupTxt(domain).catch(() => null);
  if (!txt || txt.records.length === 0) {
    policy.notes.push(`No TXT records at ${domain}.`);
    return policy;
  }

  const spfRecord = txt.records
    .map((r) => r.replace(/(^"|"$)/g, "").replace(/"\s+"/g, ""))
    .find((r) => /^v\s*=\s*spf1\b/i.test(r.trim()));

  if (!spfRecord) {
    policy.notes.push(`No v=spf1 record at ${domain}.`);
    return policy;
  }

  policy.raw = spfRecord;
  policy.found = true;

  const tokens = spfRecord
    .split(/\s+/)
    .filter((t) => t.length > 0 && !/^v\s*=\s*spf1$/i.test(t));

  for (const t of tokens) {
    const m = parseMechanism(t);
    policy.mechanisms.push(m);
    if (m.kind === "include" && m.value) policy.includes.push(m.value);
    if (m.kind === "all") policy.allQualifier = m.qualifier;
  }

  if (!policy.allQualifier) {
    policy.notes.push(
      "Policy doesn't end with an `all` mechanism — receivers may treat unknowns as pass.",
    );
  } else if (policy.allQualifier === "+") {
    policy.notes.push(
      "Tail is `+all` — every IP is allowed to send for this domain. This is practically no protection.",
    );
  } else if (policy.allQualifier === "?") {
    policy.notes.push(
      "Tail is `?all` (neutral) — domain owner expresses no opinion on unknown senders.",
    );
  } else if (policy.allQualifier === "~") {
    policy.notes.push(
      "Tail is `~all` (softfail) — unknown senders accepted with a warning.",
    );
  }

  return policy;
}

export function describePolicyTail(q: SpfQualifier | null): {
  label: string;
  tone: "good" | "warn" | "bad";
} {
  if (q === "-") return { label: "Strict (-all)", tone: "good" };
  if (q === "~") return { label: "Softfail (~all)", tone: "warn" };
  if (q === "?") return { label: "Neutral (?all)", tone: "warn" };
  if (q === "+") return { label: "Open (+all)", tone: "bad" };
  return { label: "Missing", tone: "warn" };
}
