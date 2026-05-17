import type { HeuristicFinding, ParsedEmail } from "@/lib/types";

const KNOWN_BRANDS: { name: string; legitDomains: string[] }[] = [
  // --- Finance / payments ---
  { name: "PayPal", legitDomains: ["paypal.com", "paypal.co.uk"] },
  { name: "Stripe", legitDomains: ["stripe.com"] },
  { name: "Chase", legitDomains: ["chase.com"] },
  { name: "Bank of America", legitDomains: ["bankofamerica.com"] },
  { name: "Wells Fargo", legitDomains: ["wellsfargo.com"] },
  { name: "Revolut", legitDomains: ["revolut.com"] },
  { name: "Wise", legitDomains: ["wise.com", "transferwise.com"] },
  { name: "Coinbase", legitDomains: ["coinbase.com"] },
  { name: "Binance", legitDomains: ["binance.com"] },
  { name: "Kraken", legitDomains: ["kraken.com"] },
  // --- Big tech consumer ---
  {
    name: "Microsoft",
    legitDomains: [
      "microsoft.com",
      "outlook.com",
      "office.com",
      "office365.com",
      "live.com",
      "azure.com",
      "msft.net",
    ],
  },
  { name: "Apple", legitDomains: ["apple.com", "icloud.com", "me.com"] },
  { name: "Amazon", legitDomains: ["amazon.com", "amazon.co.uk", "amazon.de"] },
  { name: "Google", legitDomains: ["google.com", "gmail.com", "youtube.com"] },
  { name: "Netflix", legitDomains: ["netflix.com", "mailer.netflix.com"] },
  { name: "Facebook", legitDomains: ["facebook.com", "facebookmail.com"] },
  { name: "Instagram", legitDomains: ["instagram.com", "mail.instagram.com"] },
  { name: "LinkedIn", legitDomains: ["linkedin.com"] },
  { name: "Spotify", legitDomains: ["spotify.com", "email.spotify.com"] },
  { name: "Adobe", legitDomains: ["adobe.com"] },
  // --- B2B SaaS / dev ---
  { name: "GitHub", legitDomains: ["github.com"] },
  { name: "GitLab", legitDomains: ["gitlab.com"] },
  { name: "Slack", legitDomains: ["slack.com"] },
  { name: "Zoom", legitDomains: ["zoom.us", "zoom.com"] },
  { name: "Notion", legitDomains: ["notion.so", "notion.com"] },
  { name: "Linear", legitDomains: ["linear.app"] },
  { name: "Figma", legitDomains: ["figma.com"] },
  { name: "Atlassian", legitDomains: ["atlassian.com", "atlassian.net"] },
  { name: "Jira", legitDomains: ["atlassian.com", "atlassian.net"] },
  { name: "Confluence", legitDomains: ["atlassian.com", "atlassian.net"] },
  { name: "AWS", legitDomains: ["amazon.com", "amazonaws.com", "aws.amazon.com"] },
  { name: "Vercel", legitDomains: ["vercel.com"] },
  { name: "Cloudflare", legitDomains: ["cloudflare.com"] },
  { name: "Okta", legitDomains: ["okta.com"] },
  { name: "Auth0", legitDomains: ["auth0.com"] },
  { name: "1Password", legitDomains: ["1password.com"] },
  { name: "LastPass", legitDomains: ["lastpass.com"] },
  { name: "Twilio", legitDomains: ["twilio.com"] },
  { name: "SendGrid", legitDomains: ["sendgrid.com", "sendgrid.net"] },
  { name: "Mailchimp", legitDomains: ["mailchimp.com"] },
  { name: "Salesforce", legitDomains: ["salesforce.com"] },
  { name: "HubSpot", legitDomains: ["hubspot.com"] },
  { name: "Asana", legitDomains: ["asana.com"] },
  { name: "Trello", legitDomains: ["trello.com"] },
  { name: "Dropbox", legitDomains: ["dropbox.com", "dropboxmail.com"] },
  {
    name: "DocuSign",
    legitDomains: ["docusign.com", "docusign.net", "via.docusign.net"],
  },
  // --- Shipping / govt ---
  { name: "DHL", legitDomains: ["dhl.com", "dhl.de"] },
  { name: "FedEx", legitDomains: ["fedex.com"] },
  { name: "UPS", legitDomains: ["ups.com"] },
  { name: "InPost", legitDomains: ["inpost.pl", "inpost.eu"] },
  { name: "IRS", legitDomains: ["irs.gov"] },
  { name: "HMRC", legitDomains: ["hmrc.gov.uk"] },
];

const FREE_MAIL_DOMAINS = new Set([
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
  "wp.pl",
  "onet.pl",
  "interia.pl",
  "o2.pl",
]);

export function analyzeSender(p: ParsedEmail): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const fromDomain = p.fromDomain;
  const displayName = (p.fromDisplayName || "").trim();
  const subject = p.subject || "";

  if (!fromDomain) {
    findings.push({
      id: "no-from",
      category: "sender",
      severity: "high",
      title: "Missing or malformed From address",
      detail: "Legitimate mail always has a parseable From header.",
    });
    return findings;
  }

  for (const brand of KNOWN_BRANDS) {
    const inDisplayName = new RegExp(`\\b${brand.name}\\b`, "i").test(
      displayName,
    );
    const inSubject = new RegExp(`\\b${brand.name}\\b`, "i").test(subject);
    if (!inDisplayName && !inSubject) continue;
    const isLegit = brand.legitDomains.some(
      (d) => fromDomain === d || fromDomain.endsWith("." + d),
    );
    if (isLegit) continue;

    if (FREE_MAIL_DOMAINS.has(fromDomain)) {
      findings.push({
        id: `brand-freemail-${brand.name.toLowerCase()}`,
        category: "sender",
        severity: "high",
        title: `${brand.name} branding from a free email account`,
        detail: `The display name or subject references ${brand.name}, but the sender domain is ${fromDomain} — a free webmail provider. ${brand.name} never sends from personal mailboxes.`,
        evidence: `From: ${p.fromHeader} • Subject: ${subject}`,
      });
      continue;
    }

    if (isLookalike(fromDomain, brand.legitDomains)) {
      findings.push({
        id: `brand-lookalike-${brand.name.toLowerCase()}`,
        category: "sender",
        severity: "high",
        title: `Lookalike domain impersonating ${brand.name}`,
        detail: `Domain ${fromDomain} is visually similar to a real ${brand.name} domain. Attackers register lookalikes to bypass casual inspection.`,
        evidence: `From domain: ${fromDomain}`,
      });
      continue;
    }

    findings.push({
      id: `brand-mismatch-${brand.name.toLowerCase()}`,
      category: "sender",
      severity: "medium",
      title: `${brand.name} branding from an unrelated domain`,
      detail: `The email claims affiliation with ${brand.name} but is sent from ${fromDomain}, which is not on the known ${brand.name} domain list.`,
      evidence: `From: ${p.fromHeader}`,
    });
  }

  if (containsPunycode(fromDomain)) {
    findings.push({
      id: "punycode-from",
      category: "sender",
      severity: "high",
      title: "Sender uses an internationalized (Punycode) domain",
      detail:
        "Domains starting with xn-- encode non-ASCII characters that can mimic real brands (homoglyph attack).",
      evidence: fromDomain,
    });
  }

  if (
    displayName &&
    /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(displayName) &&
    p.fromAddress &&
    displayName.toLowerCase() !== p.fromAddress.toLowerCase()
  ) {
    findings.push({
      id: "display-name-is-fake-email",
      category: "sender",
      severity: "high",
      title: "Display name is a fake email address",
      detail: `The header shows "${displayName}" as the display name to make it look like the sender — but the real sender is ${p.fromAddress}.`,
      evidence: p.fromHeader ?? undefined,
    });
  }

  return findings;
}

function containsPunycode(d: string): boolean {
  return /(^|\.)xn--/i.test(d);
}

function isLookalike(candidate: string, legit: string[]): boolean {
  const c = candidate.toLowerCase();
  for (const real of legit) {
    if (c === real) return false;
    const distance = levenshtein(coreLabel(c), coreLabel(real));
    if (distance > 0 && distance <= 2) return true;
    if (
      c.includes(real.split(".")[0]) &&
      !c.endsWith(real) &&
      c !== real
    ) {
      return true;
    }
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
