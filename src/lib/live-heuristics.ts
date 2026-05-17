/**
 * Client-side, synchronous, regex-only heuristics for live feedback while
 * the user is pasting/typing. No MIME parsing, no LLM call. Conservative —
 * we'd rather miss a finding than falsely accuse a legit email.
 */

export type LiveFinding = {
  id: string;
  label: string;
  tone: "danger" | "warn" | "info";
  detail: string;
};

const SUSPICIOUS_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "click",
  "country",
  "stream",
  "download",
  "loan",
  "work",
  "support",
  "kim",
  "review",
  "men",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "buzz",
  "fit",
  "rest",
  "win",
  "bid",
]);

const URL_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "t.co",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "lnkd.in",
]);

const FREE_MAIL = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "mail.ru",
  "yandex.ru",
  "yandex.com",
  "wp.pl",
  "onet.pl",
  "interia.pl",
  "o2.pl",
]);

const BRANDS = [
  { name: "PayPal", domains: ["paypal.com", "paypal.co.uk"] },
  {
    name: "Microsoft",
    domains: [
      "microsoft.com",
      "outlook.com",
      "office.com",
      "office365.com",
      "live.com",
    ],
  },
  { name: "Apple", domains: ["apple.com", "icloud.com", "me.com"] },
  { name: "Amazon", domains: ["amazon.com", "amazon.co.uk"] },
  { name: "Google", domains: ["google.com", "gmail.com"] },
  { name: "LinkedIn", domains: ["linkedin.com"] },
  { name: "DHL", domains: ["dhl.com", "dhl.de"] },
  { name: "GitHub", domains: ["github.com"] },
  { name: "Stripe", domains: ["stripe.com"] },
];

const URGENCY_PATTERNS = [
  /\burgent\b/i,
  /\bimmediately\b/i,
  /\bwithin 24 hours\b/i,
  /\bwithin 12 hours\b/i,
  /\baction required\b/i,
  /\bfinal notice\b/i,
  /\b(suspend|disabl|terminat|delet)/i,
];

const CREDENTIAL_PATTERNS = [
  /\b(verify|confirm|update)\s+your\s+(account|identity|password|details)/i,
  /\bsign\s*in\s+to\s+(your\s+)?account/i,
  /\benter\s+your\s+password\b/i,
];

const MONEY_BAIT = [
  /\bgift\s*card/i,
  /\bwire\s*transfer\b/i,
  /\bdirect\s*deposit\b/i,
  /\binvoice\b.*\bpast\s*due\b/i,
];

const RISKY_ATTACH = /filename="[^"]*\.(exe|scr|js|vbs|bat|cmd|iso|img|docm|xlsm|hta|lnk|jar)"/i;

function findHeader(raw: string, name: string): string | null {
  const re = new RegExp(`^${name}:\\s*(.+)$`, "im");
  const m = raw.match(re);
  return m ? m[1].trim() : null;
}

function extractEmail(value: string | null): string | null {
  if (!value) return null;
  const angle = value.match(/<([^>]+@[^>]+)>/);
  if (angle) return angle[1].toLowerCase();
  const plain = value.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  return plain ? plain[0].toLowerCase() : null;
}

function domainOf(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : null;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

function coreLabel(d: string): string {
  const parts = d.split(".");
  return parts.length >= 2 ? parts[parts.length - 2] : d;
}

export function runLiveHeuristics(raw: string): LiveFinding[] {
  const findings: LiveFinding[] = [];
  if (!raw || raw.length < 20) return findings;

  const fromHeader = findHeader(raw, "From");
  const fromEmail = extractEmail(fromHeader);
  const fromDomain = domainOf(fromEmail);
  const replyTo = findHeader(raw, "Reply-To");
  const replyDomain = domainOf(extractEmail(replyTo));
  const subject = findHeader(raw, "Subject") ?? "";
  const auth = findHeader(raw, "Authentication-Results") ?? "";

  // Auth-Results
  if (/spf=fail/i.test(auth)) {
    findings.push({
      id: "spf-fail",
      label: "SPF fail",
      tone: "danger",
      detail: "Sender failed SPF check — domain didn't authorize this server.",
    });
  } else if (/spf=softfail/i.test(auth)) {
    findings.push({
      id: "spf-softfail",
      label: "SPF softfail",
      tone: "warn",
      detail: "SPF softfail — domain didn't authorize but didn't strictly reject.",
    });
  }
  if (/dkim=fail/i.test(auth)) {
    findings.push({
      id: "dkim-fail",
      label: "DKIM fail",
      tone: "danger",
      detail: "DKIM signature invalid — message body or headers were modified.",
    });
  }
  if (/dmarc=fail/i.test(auth)) {
    findings.push({
      id: "dmarc-fail",
      label: "DMARC fail",
      tone: "danger",
      detail: "DMARC alignment failed — sender isn't who the From claims.",
    });
  }

  // Reply-To mismatch
  if (
    fromDomain &&
    replyDomain &&
    replyDomain !== fromDomain &&
    !replyDomain.endsWith("." + fromDomain) &&
    !fromDomain.endsWith("." + replyDomain)
  ) {
    findings.push({
      id: "reply-mismatch",
      label: "Reply-To mismatch",
      tone: "danger",
      detail: `From ${fromDomain} but replies go to ${replyDomain}.`,
    });
  }

  // Punycode in From
  if (fromDomain && /(^|\.)xn--/i.test(fromDomain)) {
    findings.push({
      id: "punycode-from",
      label: "Punycode in From",
      tone: "danger",
      detail: "Internationalized domain — possible homoglyph attack.",
    });
  }

  // Brand impersonation
  if (fromDomain) {
    const surfaceText = `${fromHeader ?? ""} ${subject}`;
    for (const b of BRANDS) {
      if (!new RegExp(`\\b${b.name}\\b`, "i").test(surfaceText)) continue;
      const isLegit = b.domains.some(
        (d) => fromDomain === d || fromDomain.endsWith("." + d),
      );
      if (isLegit) continue;
      if (FREE_MAIL.has(fromDomain)) {
        findings.push({
          id: `brand-freemail-${b.name.toLowerCase()}`,
          label: `${b.name} from free webmail`,
          tone: "danger",
          detail: `${b.name} would never email you from ${fromDomain}.`,
        });
        break;
      }
      const dist = levenshtein(coreLabel(fromDomain), coreLabel(b.domains[0]));
      if (dist > 0 && dist <= 2) {
        findings.push({
          id: `lookalike-${b.name.toLowerCase()}`,
          label: `Lookalike of ${b.name}`,
          tone: "danger",
          detail: `${fromDomain} is one or two characters off from a real ${b.name} domain.`,
        });
        break;
      }
      findings.push({
        id: `brand-mismatch-${b.name.toLowerCase()}`,
        label: `Claims ${b.name}, wrong domain`,
        tone: "warn",
        detail: `Email mentions ${b.name} but the sender domain isn't on their official list.`,
      });
      break;
    }
  }

  // Links — find hrefs
  const hrefs: string[] = [];
  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let mm: RegExpExecArray | null;
  while ((mm = hrefRe.exec(raw)) !== null) hrefs.push(mm[1]);

  const seenLinkFlags = new Set<string>();
  for (const href of hrefs) {
    // @ trick
    if (/^https?:\/\/[^/]+@/i.test(href) && !seenLinkFlags.has("at-trick")) {
      findings.push({
        id: "at-trick",
        label: "@-trick in URL",
        tone: "danger",
        detail: "Everything before @ is treated as credentials and ignored.",
      });
      seenLinkFlags.add("at-trick");
    }
    // IP host
    if (
      /^https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(href) &&
      !seenLinkFlags.has("ip-host")
    ) {
      findings.push({
        id: "ip-host",
        label: "Raw-IP URL",
        tone: "danger",
        detail: "Real brands don't link to bare IP addresses.",
      });
      seenLinkFlags.add("ip-host");
    }
    // Punycode in link
    if (/\/\/[^/]*xn--/i.test(href) && !seenLinkFlags.has("puny-link")) {
      findings.push({
        id: "puny-link",
        label: "Punycode link",
        tone: "danger",
        detail: "URL hostname uses xn-- encoding — possible visual spoof.",
      });
      seenLinkFlags.add("puny-link");
    }
    // Suspicious TLD
    try {
      const u = new URL(href);
      const host = u.hostname.toLowerCase();
      const tld = host.split(".").pop();
      if (
        tld &&
        SUSPICIOUS_TLDS.has(tld) &&
        !seenLinkFlags.has(`tld-${tld}`)
      ) {
        findings.push({
          id: `tld-${tld}`,
          label: `Link on .${tld}`,
          tone: "warn",
          detail: "High-abuse TLD often used for phishing infrastructure.",
        });
        seenLinkFlags.add(`tld-${tld}`);
      }
      if (URL_SHORTENERS.has(host) && !seenLinkFlags.has(`short-${host}`)) {
        findings.push({
          id: `short-${host}`,
          label: `Shortener (${host})`,
          tone: "warn",
          detail: "Real brands rarely send security mail through shorteners.",
        });
        seenLinkFlags.add(`short-${host}`);
      }
    } catch {
      /* malformed URL — skip */
    }
  }

  // Anchor↔href mismatch — quick check
  const anchorRe = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let am: RegExpExecArray | null;
  let anchorMismatchAdded = false;
  while ((am = anchorRe.exec(raw)) !== null && !anchorMismatchAdded) {
    const href = am[1];
    const text = am[2].replace(/<[^>]+>/g, "").trim();
    const looksLikeUrl = /^https?:\/\//i.test(text);
    if (!looksLikeUrl) continue;
    try {
      const hrefHost = new URL(href).hostname.toLowerCase();
      const textHost = new URL(text).hostname.toLowerCase();
      if (hrefHost && textHost && hrefHost !== textHost) {
        findings.push({
          id: "anchor-mismatch",
          label: "Link text ≠ real URL",
          tone: "danger",
          detail: `Shows ${textHost} but actually links to ${hrefHost}.`,
        });
        anchorMismatchAdded = true;
      }
    } catch {
      /* malformed — skip */
    }
  }

  // Urgency
  let urgencyHits = 0;
  for (const p of URGENCY_PATTERNS) if (p.test(raw)) urgencyHits++;
  if (urgencyHits >= 2) {
    findings.push({
      id: "urgency",
      label: "Urgency language",
      tone: "warn",
      detail: "Multiple urgency cues — pressure tactic to bypass careful reading.",
    });
  }

  // Credential request
  for (const p of CREDENTIAL_PATTERNS) {
    if (p.test(raw)) {
      findings.push({
        id: "credential-request",
        label: "Credential request",
        tone: "warn",
        detail: "Asks you to verify/confirm/sign in — common phishing payload.",
      });
      break;
    }
  }

  // Money bait
  for (const p of MONEY_BAIT) {
    if (p.test(raw)) {
      findings.push({
        id: "money-bait",
        label: "Money / gift-card bait",
        tone: "warn",
        detail: "Common BEC and invoice-fraud signal.",
      });
      break;
    }
  }

  // Risky attachment
  if (RISKY_ATTACH.test(raw)) {
    findings.push({
      id: "risky-attachment",
      label: "Risky attachment",
      tone: "danger",
      detail: "Macro-enabled doc or executable container detected.",
    });
  }

  // Dedup by id (defensive)
  const seen = new Set<string>();
  return findings.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}
