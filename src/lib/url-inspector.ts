import type { Severity, UrlFinding, UrlParts } from "@/lib/types";

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
  "tiny.cc",
  "v.gd",
  "s.id",
]);

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

const KNOWN_BRANDS: { name: string; legitDomains: string[] }[] = [
  { name: "PayPal", legitDomains: ["paypal.com", "paypal.co.uk"] },
  {
    name: "Microsoft",
    legitDomains: [
      "microsoft.com",
      "outlook.com",
      "office.com",
      "office365.com",
      "live.com",
      "azure.com",
    ],
  },
  { name: "Apple", legitDomains: ["apple.com", "icloud.com", "me.com"] },
  { name: "Amazon", legitDomains: ["amazon.com", "amazon.co.uk", "amazon.de"] },
  { name: "Google", legitDomains: ["google.com", "gmail.com", "youtube.com"] },
  { name: "Netflix", legitDomains: ["netflix.com"] },
  { name: "Facebook", legitDomains: ["facebook.com"] },
  { name: "Instagram", legitDomains: ["instagram.com"] },
  { name: "LinkedIn", legitDomains: ["linkedin.com"] },
  { name: "DHL", legitDomains: ["dhl.com", "dhl.de"] },
  { name: "FedEx", legitDomains: ["fedex.com"] },
  { name: "UPS", legitDomains: ["ups.com"] },
  { name: "Chase", legitDomains: ["chase.com"] },
  { name: "Stripe", legitDomains: ["stripe.com"] },
  { name: "GitHub", legitDomains: ["github.com"] },
  { name: "Dropbox", legitDomains: ["dropbox.com"] },
  { name: "DocuSign", legitDomains: ["docusign.com", "docusign.net"] },
  { name: "Binance", legitDomains: ["binance.com"] },
  { name: "Coinbase", legitDomains: ["coinbase.com"] },
];

const SEVERITY_WEIGHT: Record<Severity, number> = {
  info: 0,
  low: 8,
  medium: 18,
  high: 32,
};

const CREDENTIAL_KEYWORDS = [
  "login",
  "signin",
  "verify",
  "secure",
  "account",
  "update",
  "confirm",
  "unlock",
  "recover",
  "wallet",
  "auth",
];

export type ParsedUrl = {
  parts: UrlParts;
};

export class UrlParseError extends Error {}

export function parseUserUrl(input: string): UrlParts {
  const trimmed = input.trim();
  if (!trimmed) throw new UrlParseError("Provide a URL or domain.");

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    throw new UrlParseError("That doesn't look like a valid URL.");
  }

  const asciiHost = u.hostname.toLowerCase();
  const unicodeHost = tryToUnicode(asciiHost);
  const hostParts = asciiHost.split(".");
  const tld = hostParts.length > 1 ? hostParts[hostParts.length - 1] : "";
  const registrable =
    hostParts.length >= 2 ? hostParts.slice(-2).join(".") : asciiHost;
  const subdomainDepth = Math.max(0, hostParts.length - 2);

  return {
    input: trimmed,
    normalized: u.toString(),
    protocol: u.protocol.replace(":", ""),
    hostname: asciiHost,
    unicodeHostname: unicodeHost,
    port: u.port,
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
    username: u.username,
    password: u.password,
    registrableDomain: registrable,
    tld,
    subdomainDepth,
  };
}

function tryToUnicode(asciiHost: string): string {
  if (!asciiHost.includes("xn--")) return asciiHost;
  try {
    const url = new URL(`http://${asciiHost}`);
    return url.hostname;
  } catch {
    return asciiHost;
  }
}

export function inspectUrl(parts: UrlParts): {
  findings: UrlFinding[];
  score: number;
} {
  const findings: UrlFinding[] = [];
  const host = parts.hostname;

  if (parts.protocol !== "https" && parts.protocol !== "http") {
    findings.push({
      id: "unusual-protocol",
      severity: "medium",
      title: `Unusual protocol: ${parts.protocol}://`,
      detail:
        "Web links almost always use http or https. Other schemes can trigger unexpected handlers on the device.",
      evidence: parts.normalized,
    });
  } else if (parts.protocol === "http") {
    findings.push({
      id: "no-tls",
      severity: "low",
      title: "Link is plain HTTP, not HTTPS",
      detail:
        "Modern services force HTTPS. Plain HTTP allows network attackers to read or rewrite traffic in transit.",
    });
  }

  if (parts.username || parts.password) {
    findings.push({
      id: "url-userinfo",
      severity: "high",
      title: "URL uses the @ trick to hide the real domain",
      detail:
        "Anything before @ in a URL is treated as credentials and ignored by browsers. The real destination is the host after @.",
      evidence: parts.normalized,
    });
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    findings.push({
      id: "ip-host",
      severity: "high",
      title: "Host is a raw IP address",
      detail:
        "Legitimate brands link to named domains, not numeric IPs. Bare-IP URLs are typical of disposable phishing infrastructure.",
      evidence: host,
    });
  }

  if (/(^|\.)xn--/i.test(host)) {
    findings.push({
      id: "punycode",
      severity: "high",
      title: "Host uses Punycode (xn--) — possible homoglyph attack",
      detail:
        "Internationalized domains can encode Cyrillic, Greek or other lookalike characters. Rendered, they're nearly indistinguishable from a real brand.",
      evidence: `${host} → ${parts.unicodeHostname}`,
    });
  }

  if (parts.tld && SUSPICIOUS_TLDS.has(parts.tld)) {
    findings.push({
      id: "suspicious-tld",
      severity: "medium",
      title: `High-abuse TLD: .${parts.tld}`,
      detail:
        "This top-level domain is cheap, easy to register anonymously, and disproportionately used for phishing and malware delivery.",
      evidence: host,
    });
  }

  if (URL_SHORTENERS.has(host)) {
    findings.push({
      id: "url-shortener",
      severity: "medium",
      title: "URL shortener hides the real destination",
      detail:
        "Shorteners obscure where the link actually leads. Banks, governments and corporate IT never use them in security or account notifications.",
      evidence: host,
    });
  }

  if (parts.subdomainDepth >= 4) {
    findings.push({
      id: "deep-subdomain",
      severity: "medium",
      title: `Unusually deep subdomain chain (${parts.subdomainDepth} levels)`,
      detail:
        "Attackers stack many subdomains to hide the real registrable domain in the middle (e.g. account.apple.com.update.secure.evil.tld). Read URLs right-to-left.",
      evidence: host,
    });
  }

  if (parts.port && parts.port !== "80" && parts.port !== "443") {
    findings.push({
      id: "nonstandard-port",
      severity: "low",
      title: `Non-standard port :${parts.port}`,
      detail:
        "Public-facing brand services run on 80/443. A custom port often means a homemade or temporary server.",
    });
  }

  for (const brand of KNOWN_BRANDS) {
    const label = brand.name.toLowerCase();
    const hostLc = host.toLowerCase();
    const isLegit = brand.legitDomains.some(
      (d) => hostLc === d || hostLc.endsWith("." + d),
    );
    if (isLegit) continue;
    if (!hostLc.includes(label) && !isLookalike(parts.registrableDomain, brand.legitDomains)) {
      continue;
    }
    if (hostLc.includes(label)) {
      findings.push({
        id: `brand-imitation-${label}`,
        severity: "high",
        title: `Host imitates ${brand.name} but isn't on ${brand.name}'s known domain list`,
        detail: `Domain ${parts.registrableDomain} contains the word "${brand.name}" but is not one of ${brand.name}'s real domains (${brand.legitDomains.join(", ")}). Brands stick to their own root domain.`,
        evidence: host,
      });
    } else {
      findings.push({
        id: `lookalike-${label}`,
        severity: "high",
        title: `Lookalike of ${brand.name} (${parts.registrableDomain})`,
        detail: `${parts.registrableDomain} is visually similar to a real ${brand.name} domain. Attackers register typo-variants to bypass casual inspection.`,
        evidence: host,
      });
    }
    break;
  }

  if (host.length > 35 && !findings.some((f) => f.id.startsWith("brand-"))) {
    findings.push({
      id: "long-host",
      severity: "low",
      title: "Unusually long hostname",
      detail:
        "Long hostnames are sometimes used to push the suspicious part off-screen in mobile browsers.",
      evidence: `${host.length} chars`,
    });
  }

  const pathLc = parts.pathname.toLowerCase();
  const credKeyword = CREDENTIAL_KEYWORDS.find((k) => pathLc.includes(k));
  if (credKeyword) {
    findings.push({
      id: "credential-path",
      severity: "low",
      title: `Path contains a credential keyword: "${credKeyword}"`,
      detail:
        "Words like login/verify/secure in the URL path are a weak signal — common to both real login pages and phishing. Combined with other red flags, treat as elevating.",
      evidence: parts.pathname,
    });
  }

  if (parts.search.length > 200) {
    findings.push({
      id: "long-query",
      severity: "info",
      title: "Very long query string",
      detail:
        "Long base64-looking query strings often carry encoded victim identifiers or tracking. Not malicious on its own, but worth noting.",
      evidence: `${parts.search.length} chars`,
    });
  }

  let score = 0;
  for (const f of findings) score += SEVERITY_WEIGHT[f.severity];
  score = Math.min(100, score);

  return { findings, score };
}

function isLookalike(candidate: string, legit: string[]): boolean {
  const c = candidate.toLowerCase();
  for (const real of legit) {
    if (c === real) return false;
    const distance = levenshtein(coreLabel(c), coreLabel(real));
    if (distance > 0 && distance <= 2) return true;
  }
  return false;
}

function coreLabel(d: string): string {
  const parts = d.split(".");
  if (parts.length < 2) return d;
  return parts[parts.length - 2];
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
