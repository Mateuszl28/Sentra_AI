import type { HeuristicFinding, ParsedEmail } from "@/lib/types";

const URGENCY_PATTERNS = [
  /\burgent\b/i,
  /\bimmediate(?:ly)?\b/i,
  /\bact\s+now\b/i,
  /\bwithin\s+\d+\s+hours?\b/i,
  /\bwithin\s+24\s*h(?:ours?)?\b/i,
  /\bexpires?\s+(?:today|tomorrow|soon)/i,
  /\bfinal\s+(?:warning|notice|reminder)\b/i,
  /\blast\s+chance\b/i,
  /\btime[\s-]sensitive\b/i,
];

const THREAT_PATTERNS = [
  /\baccount\s+(?:has\s+been\s+)?(?:suspended|locked|disabled|closed|terminated|deactivated)\b/i,
  /\bwill\s+be\s+(?:suspended|locked|disabled|closed|terminated|deactivated)\b/i,
  /\blegal\s+action\b/i,
  /\bunauthorized\s+(?:access|login|sign[- ]?in)\b/i,
  /\bsecurity\s+alert\b/i,
  /\bunusual\s+(?:sign[- ]?in|activity|login)\b/i,
  /\bsuspicious\s+activity\b/i,
  /\bverify\s+your\s+(?:account|identity|email)\b/i,
  /\bconfirm\s+your\s+(?:account|identity|password|credit\s+card|payment)/i,
];

const CREDENTIAL_REQUEST_PATTERNS = [
  /\b(?:re[- ]?enter|provide|update|confirm)\s+(?:your\s+)?(?:password|pin|ssn|social\s+security|credit\s+card|cvv|bank\s+details)\b/i,
  /\bclick\s+(?:here|below|the\s+link)\s+to\s+(?:verify|confirm|update|reset|secure)\b/i,
  /\bsign\s+in\s+to\s+(?:secure|verify|confirm|reactivate)\b/i,
];

const GENERIC_GREETINGS = [
  /^\s*(?:dear|hello|hi)\s+(?:customer|user|member|client|sir(?:\/madam)?|valued\s+customer|account\s+holder)/i,
];

const MONEY_BAIT = [
  /\$\s*\d{2,}/,
  /€\s*\d{2,}/,
  /£\s*\d{2,}/,
  /\b(?:gift\s+card|inheritance|lottery|prize|refund|reward|compensation)\b/i,
  /\bcrypto(?:currency)?\s+(?:wallet|payment|transfer)\b/i,
];

export function analyzeContent(p: ParsedEmail): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const text = p.bodyText || stripHtml(p.bodyHtml || "");
  const subject = p.subject || "";
  const corpus = `${subject}\n${text}`;
  if (!corpus.trim()) return findings;

  const urgencyHits = URGENCY_PATTERNS.flatMap((re) => match(re, corpus));
  if (urgencyHits.length > 0) {
    findings.push({
      id: "urgency-language",
      category: "content",
      severity: urgencyHits.length >= 2 ? "high" : "medium",
      title: "Pressure / urgency language",
      detail:
        "Phishers manufacture time pressure to bypass deliberate thinking. Reputable services give you days, not minutes, to act.",
      evidence: urgencyHits.slice(0, 3).join(" • "),
    });
  }

  const threatHits = THREAT_PATTERNS.flatMap((re) => match(re, corpus));
  if (threatHits.length > 0) {
    findings.push({
      id: "threat-language",
      category: "content",
      severity: "high",
      title: "Account-suspension or security-alert framing",
      detail:
        "Fear of losing access is the single most common phishing hook. Verify status by logging in through a fresh browser tab — never via the email link.",
      evidence: threatHits.slice(0, 3).join(" • "),
    });
  }

  const credHits = CREDENTIAL_REQUEST_PATTERNS.flatMap((re) =>
    match(re, corpus),
  );
  if (credHits.length > 0) {
    findings.push({
      id: "credential-request",
      category: "content",
      severity: "high",
      title: "Asks you to enter credentials or sensitive data",
      detail:
        "Banks, governments and major providers do not request passwords, PINs, full SSNs or card numbers over email.",
      evidence: credHits.slice(0, 2).join(" • "),
    });
  }

  for (const re of GENERIC_GREETINGS) {
    const m = text.match(re);
    if (m) {
      findings.push({
        id: "generic-greeting",
        category: "content",
        severity: "low",
        title: "Generic greeting (no real name)",
        detail:
          "Mass phishing campaigns blast the same template to thousands of addresses, so they can't personalize the greeting.",
        evidence: m[0].trim(),
      });
      break;
    }
  }

  const moneyHits = MONEY_BAIT.flatMap((re) => match(re, corpus));
  if (moneyHits.length > 0) {
    findings.push({
      id: "money-bait",
      category: "content",
      severity: "medium",
      title: "Refund / prize / payment bait",
      detail:
        "Offers of unexpected money are classic advance-fee or credential-harvest setups.",
      evidence: moneyHits.slice(0, 3).join(" • "),
    });
  }

  for (const att of p.attachments) {
    if (att.riskyExtension) {
      findings.push({
        id: `risky-attachment-${att.filename}`,
        category: "attachment",
        severity: "high",
        title: `Risky attachment: ${att.filename}`,
        detail:
          "Executable or macro-enabled files delivered by email are a primary malware vector. Do not open.",
        evidence: `${att.filename} (${att.contentType})`,
      });
    }
  }

  return findings;
}

function match(re: RegExp, s: string): string[] {
  const out: string[] = [];
  const re2 = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = re2.exec(s))) {
    out.push(m[0].trim());
    if (out.length > 5) break;
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
