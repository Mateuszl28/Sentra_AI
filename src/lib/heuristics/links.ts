import type { HeuristicFinding, ParsedEmail, ParsedLink } from "@/lib/types";

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
]);

export function analyzeLinks(p: ParsedEmail): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  if (p.links.length === 0) return findings;

  const fromDomain = p.fromDomain;
  const mismatches: ParsedLink[] = [];
  const shorteners: ParsedLink[] = [];
  const ipUrls: ParsedLink[] = [];
  const atSignTricks: ParsedLink[] = [];
  const suspiciousTld: ParsedLink[] = [];
  const punycode: ParsedLink[] = [];
  const offDomain: ParsedLink[] = [];

  for (const l of p.links) {
    if (l.isMismatch) mismatches.push(l);
    if (l.href.includes("@") && !l.href.startsWith("mailto:")) {
      try {
        const u = new URL(l.href);
        if (u.username || u.password) atSignTricks.push(l);
      } catch {}
    }
    if (URL_SHORTENERS.has(l.hostname.toLowerCase())) shorteners.push(l);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(l.hostname)) ipUrls.push(l);

    const tld = l.hostname.split(".").pop()?.toLowerCase();
    if (tld && SUSPICIOUS_TLDS.has(tld)) suspiciousTld.push(l);

    if (/(^|\.)xn--/i.test(l.hostname)) punycode.push(l);

    if (
      fromDomain &&
      l.hostname &&
      !l.hostname.endsWith(fromDomain) &&
      !sharesBaseDomain(l.hostname, fromDomain)
    ) {
      offDomain.push(l);
    }
  }

  if (mismatches.length > 0) {
    const top = mismatches.slice(0, 3);
    findings.push({
      id: "anchor-href-mismatch",
      category: "link",
      severity: "high",
      title: "Link text doesn't match the actual URL",
      detail:
        "Classic phishing trick — a link that displays a trusted address but secretly points elsewhere. Always hover before clicking.",
      evidence: top
        .map((l) => `"${trunc(l.anchorText, 60)}" → ${l.href}`)
        .join("\n"),
    });
  }

  if (atSignTricks.length > 0) {
    findings.push({
      id: "at-sign-trick",
      category: "link",
      severity: "high",
      title: "URL uses the @ trick to hide the real domain",
      detail:
        "Everything before the @ in a URL is treated as credentials and ignored by browsers. http://paypal.com@evil.tld actually visits evil.tld.",
      evidence: atSignTricks.map((l) => l.href).join("\n"),
    });
  }

  if (ipUrls.length > 0) {
    findings.push({
      id: "ip-url",
      category: "link",
      severity: "high",
      title: "Links to a raw IP address",
      detail:
        "Legitimate brands link to named domains, not bare IPs. IP-based URLs are typical of throwaway phishing infrastructure.",
      evidence: ipUrls.map((l) => l.href).join("\n"),
    });
  }

  if (shorteners.length > 0) {
    findings.push({
      id: "url-shortener",
      category: "link",
      severity: "medium",
      title: "URL shortener hides the real destination",
      detail:
        "Banks, governments and corporate IT never use bit.ly / tinyurl in account notifications.",
      evidence: shorteners.map((l) => l.href).join("\n"),
    });
  }

  if (suspiciousTld.length > 0) {
    findings.push({
      id: "suspicious-tld",
      category: "link",
      severity: "medium",
      title: "Links use a high-abuse TLD",
      detail:
        "Top-level domains like .zip, .top, .click, .tk are cheap and disproportionately used for phishing and malware delivery.",
      evidence: suspiciousTld.map((l) => l.href).slice(0, 3).join("\n"),
    });
  }

  if (punycode.length > 0) {
    findings.push({
      id: "punycode-link",
      category: "link",
      severity: "high",
      title: "Link uses Punycode (xn--) — possible homoglyph",
      detail:
        "Internationalized domains can encode Cyrillic or Greek letters that look identical to Latin ones (pаypal.com vs paypal.com).",
      evidence: punycode.map((l) => l.href).join("\n"),
    });
  }

  if (
    fromDomain &&
    offDomain.length > 0 &&
    offDomain.length >= Math.ceil(p.links.length / 2)
  ) {
    findings.push({
      id: "links-off-domain",
      category: "link",
      severity: "low",
      title: "Most links point away from the sender's domain",
      detail: `Sender claims to be ${fromDomain} but the majority of links lead elsewhere (${offDomain
        .slice(0, 3)
        .map((l) => l.hostname)
        .join(", ")}).`,
    });
  }

  return findings;
}

function sharesBaseDomain(a: string, b: string): boolean {
  const ba = baseDomain(a);
  const bb = baseDomain(b);
  return !!ba && ba === bb;
}

function baseDomain(host: string): string {
  const parts = host.toLowerCase().split(".");
  if (parts.length < 2) return host;
  return parts.slice(-2).join(".");
}

function trunc(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
