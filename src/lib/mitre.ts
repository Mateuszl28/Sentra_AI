/**
 * Mapping of Sentra's deterministic heuristic IDs to MITRE ATT&CK
 * techniques and sub-techniques (Enterprise matrix v14+).
 *
 * Each entry includes the technique ID, short name, and a link
 * stub that the UI resolves to https://attack.mitre.org/techniques/<id>/.
 */

export type MitreRef = {
  id: string;
  name: string;
  tactic: string;
};

/**
 * Stable mapping. The key is the `HeuristicFinding.id` (email-side) or
 * `UrlFinding.id` (URL inspector).
 */
const MAP: Record<string, MitreRef> = {
  // --- Authentication / spoofing (header layer) ---
  "spf-fail": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },
  "spf-none": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },
  "dkim-fail": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },
  "dkim-none": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },
  "dmarc-fail": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },
  "reply-to-mismatch": {
    id: "T1656",
    name: "Impersonation",
    tactic: "Defense Evasion",
  },
  "return-path-mismatch": {
    id: "T1656",
    name: "Impersonation",
    tactic: "Defense Evasion",
  },
  "received-single-hop": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },
  "received-private-ip": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },
  "received-time-travel": {
    id: "T1070.006",
    name: "Timestomp",
    tactic: "Defense Evasion",
  },
  "received-big-gap": {
    id: "T1566",
    name: "Phishing",
    tactic: "Initial Access",
  },

  // --- Sender / impersonation ---
  "no-from": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },
  "punycode-from": {
    id: "T1036.005",
    name: "Match Legitimate Name or Location",
    tactic: "Defense Evasion",
  },
  "display-name-is-fake-email": {
    id: "T1656",
    name: "Impersonation",
    tactic: "Defense Evasion",
  },
  // sender.ts dynamic IDs: brand-freemail-* / brand-lookalike-* / brand-mismatch-*
  // — handled via prefix lookup below

  // --- Link tricks ---
  "anchor-href-mismatch": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },
  "at-sign-trick": {
    id: "T1036.008",
    name: "Masquerade File Type",
    tactic: "Defense Evasion",
  },
  "ip-url": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },
  "url-shortener": {
    id: "T1036",
    name: "Masquerading",
    tactic: "Defense Evasion",
  },
  "suspicious-tld": {
    id: "T1583.001",
    name: "Acquire Infrastructure: Domains",
    tactic: "Resource Development",
  },
  "punycode-link": {
    id: "T1036.005",
    name: "Match Legitimate Name or Location",
    tactic: "Defense Evasion",
  },
  "links-off-domain": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },

  // --- URL inspector ---
  "unusual-protocol": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },
  "no-tls": {
    id: "T1071.001",
    name: "Web Protocols",
    tactic: "Command and Control",
  },
  "url-userinfo": {
    id: "T1036.008",
    name: "Masquerade File Type",
    tactic: "Defense Evasion",
  },
  "ip-host": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },
  punycode: {
    id: "T1036.005",
    name: "Match Legitimate Name or Location",
    tactic: "Defense Evasion",
  },
  "deep-subdomain": {
    id: "T1036",
    name: "Masquerading",
    tactic: "Defense Evasion",
  },
  "nonstandard-port": {
    id: "T1571",
    name: "Non-Standard Port",
    tactic: "Command and Control",
  },
  "long-host": {
    id: "T1036",
    name: "Masquerading",
    tactic: "Defense Evasion",
  },
  "credential-path": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },
  "long-query": {
    id: "T1132.001",
    name: "Standard Encoding",
    tactic: "Command and Control",
  },
  "domain-very-fresh": {
    id: "T1583.001",
    name: "Acquire Infrastructure: Domains",
    tactic: "Resource Development",
  },
  "domain-fresh": {
    id: "T1583.001",
    name: "Acquire Infrastructure: Domains",
    tactic: "Resource Development",
  },
  "domain-young": {
    id: "T1583.001",
    name: "Acquire Infrastructure: Domains",
    tactic: "Resource Development",
  },
  "domain-null-mx": {
    id: "T1583.001",
    name: "Acquire Infrastructure: Domains",
    tactic: "Resource Development",
  },
  "domain-no-mx": {
    id: "T1583.001",
    name: "Acquire Infrastructure: Domains",
    tactic: "Resource Development",
  },

  // --- Content ---
  urgency: {
    id: "T1656",
    name: "Impersonation",
    tactic: "Defense Evasion",
  },
  "credential-request": {
    id: "T1566.002",
    name: "Spearphishing Link",
    tactic: "Initial Access",
  },
  "threat-language": {
    id: "T1656",
    name: "Impersonation",
    tactic: "Defense Evasion",
  },
  "money-bait": {
    id: "T1657",
    name: "Financial Theft",
    tactic: "Impact",
  },

  // --- Attachments ---
  "risky-attachment": {
    id: "T1566.001",
    name: "Spearphishing Attachment",
    tactic: "Initial Access",
  },
};

const PREFIX_MAP: { prefix: string; ref: MitreRef }[] = [
  {
    prefix: "brand-freemail-",
    ref: { id: "T1656", name: "Impersonation", tactic: "Defense Evasion" },
  },
  {
    prefix: "brand-lookalike-",
    ref: {
      id: "T1036.005",
      name: "Match Legitimate Name or Location",
      tactic: "Defense Evasion",
    },
  },
  {
    prefix: "brand-mismatch-",
    ref: { id: "T1656", name: "Impersonation", tactic: "Defense Evasion" },
  },
  {
    prefix: "brand-imitation-",
    ref: { id: "T1656", name: "Impersonation", tactic: "Defense Evasion" },
  },
  {
    prefix: "lookalike-",
    ref: {
      id: "T1036.005",
      name: "Match Legitimate Name or Location",
      tactic: "Defense Evasion",
    },
  },
  {
    prefix: "tld-",
    ref: {
      id: "T1583.001",
      name: "Acquire Infrastructure: Domains",
      tactic: "Resource Development",
    },
  },
  {
    prefix: "short-",
    ref: { id: "T1036", name: "Masquerading", tactic: "Defense Evasion" },
  },
];

export function mitreFor(findingId: string): MitreRef | null {
  const exact = MAP[findingId];
  if (exact) return exact;
  for (const { prefix, ref } of PREFIX_MAP) {
    if (findingId.startsWith(prefix)) return ref;
  }
  return null;
}

export function mitreLink(id: string): string {
  // Sub-technique IDs use a slash: T1566.002 → /techniques/T1566/002/
  const parts = id.split(".");
  if (parts.length === 2) {
    return `https://attack.mitre.org/techniques/${parts[0]}/${parts[1]}/`;
  }
  return `https://attack.mitre.org/techniques/${parts[0]}/`;
}
