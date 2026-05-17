/**
 * DKIM-Signature header parser + public-key DNS lookup.
 *
 * Note: this module does NOT perform cryptographic signature verification —
 * full DKIM verify needs canonicalization of body and selected headers per
 * RFC 6376, which is intricate to get right. What we do here:
 *
 *   1. Parse every DKIM-Signature header into its tagged fields.
 *   2. Resolve `<selector>._domainkey.<domain>` TXT via DoH (Cloudflare).
 *   3. Decide a status per signature: present / missing / revoked / malformed.
 *
 * The "key resolves & matches algorithm" check alone catches a huge slice of
 * forged signatures — attackers often invent a selector that simply doesn't
 * exist in DNS.
 */

import { lookupTxt } from "./dns";

export type DkimField = {
  raw: string;
  version: string | null;
  algorithm: string | null;
  signingDomain: string | null;
  selector: string | null;
  canonicalization: string | null;
  headersSigned: string[] | null;
  bodyHash: string | null;
  signature: string | null;
};

export type DkimKeyStatus =
  | "present"
  | "revoked"
  | "missing"
  | "malformed"
  | "lookup-failed";

export type DkimReport = {
  signature: DkimField;
  keyStatus: DkimKeyStatus;
  publicKey: string | null;
  publicKeyAlgorithm: string | null;
  notes: string[];
};

function parseTags(raw: string): Record<string, string> {
  // Strip CRLF / line folds.
  const cleaned = raw.replace(/\r?\n[\s\t]+/g, " ");
  const out: Record<string, string> = {};
  for (const pair of cleaned.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/\s+/g, "");
    if (key) out[key] = value;
  }
  return out;
}

export function parseDkimSignatures(rawEmail: string): DkimField[] {
  const out: DkimField[] = [];
  // Multi-line header — RFC 5322 folding.
  const re = /^DKIM-Signature:\s*([\s\S]*?)(?=^\S|\r?\n\r?\n)/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawEmail)) !== null) {
    const blob = m[1];
    const tags = parseTags(blob);
    out.push({
      raw: blob.trim(),
      version: tags["v"] ?? null,
      algorithm: tags["a"] ?? null,
      signingDomain: tags["d"]?.toLowerCase() ?? null,
      selector: tags["s"] ?? null,
      canonicalization: tags["c"] ?? null,
      headersSigned: tags["h"] ? tags["h"].split(":").map((s) => s.trim().toLowerCase()) : null,
      bodyHash: tags["bh"] ?? null,
      signature: tags["b"] ?? null,
    });
  }
  return out;
}

function parseDkimDnsTxt(txt: string): { tags: Record<string, string>; revoked: boolean } {
  // Cloudflare DoH wraps TXT values in quotes; strip them.
  const stripped = txt.replace(/(^"|"$)/g, "").replace(/"\s+"/g, "");
  const tags = parseTags(stripped);
  const revoked = !!tags["p"] && tags["p"].length === 0;
  return { tags, revoked };
}

export async function inspectDkim(
  field: DkimField,
): Promise<DkimReport> {
  const notes: string[] = [];
  if (!field.signingDomain || !field.selector) {
    notes.push("DKIM signature missing required d= or s= tag.");
    return {
      signature: field,
      keyStatus: "malformed",
      publicKey: null,
      publicKeyAlgorithm: null,
      notes,
    };
  }

  const fqdn = `${field.selector}._domainkey.${field.signingDomain}`;
  const lookup = await lookupTxt(fqdn);
  if (lookup.records.length === 0) {
    notes.push(`No TXT at ${fqdn} — attacker may have invented the selector.`);
    return {
      signature: field,
      keyStatus: lookup.empty ? "missing" : "lookup-failed",
      publicKey: null,
      publicKeyAlgorithm: null,
      notes,
    };
  }

  // Concatenate any split TXT chunks.
  const joined = lookup.records.join("");
  const { tags, revoked } = parseDkimDnsTxt(joined);
  if (revoked) {
    notes.push(`Public key entry has p= empty — revoked or rotated.`);
    return {
      signature: field,
      keyStatus: "revoked",
      publicKey: null,
      publicKeyAlgorithm: tags["k"] ?? null,
      notes,
    };
  }

  if (tags["k"] && field.algorithm && !field.algorithm.toLowerCase().startsWith(tags["k"].toLowerCase())) {
    notes.push(
      `Algorithm mismatch — signature claims ${field.algorithm} but DNS key advertises k=${tags["k"]}.`,
    );
  }

  return {
    signature: field,
    keyStatus: "present",
    publicKey: tags["p"] ?? null,
    publicKeyAlgorithm: tags["k"] ?? "rsa",
    notes,
  };
}

export async function inspectAllDkim(rawEmail: string): Promise<DkimReport[]> {
  const signatures = parseDkimSignatures(rawEmail);
  if (signatures.length === 0) return [];
  return Promise.all(signatures.map(inspectDkim));
}
