import type { HeuristicFinding, ParsedEmail } from "@/lib/types";

export function analyzeHeaders(p: ParsedEmail): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const { authResults } = p;

  if (authResults.spf === "fail" || authResults.spf === "softfail") {
    findings.push({
      id: "spf-fail",
      category: "header",
      severity: authResults.spf === "fail" ? "high" : "medium",
      title: `SPF ${authResults.spf.toUpperCase()}`,
      detail:
        "The sending server is not authorized by the claimed sender domain. This is a strong indicator of spoofing.",
      evidence: authResults.raw ?? undefined,
    });
  } else if (authResults.spf === "none") {
    findings.push({
      id: "spf-none",
      category: "header",
      severity: "low",
      title: "No SPF record",
      detail:
        "The sender domain publishes no SPF policy, so the receiving server cannot verify the sending IP.",
    });
  }

  if (authResults.dkim === "fail") {
    findings.push({
      id: "dkim-fail",
      category: "header",
      severity: "high",
      title: "DKIM signature failed",
      detail:
        "The cryptographic signature on this email is invalid — the body was tampered with or never signed by the claimed sender.",
      evidence: authResults.raw ?? undefined,
    });
  } else if (authResults.dkim === "none") {
    findings.push({
      id: "dkim-none",
      category: "header",
      severity: "low",
      title: "No DKIM signature",
      detail:
        "Large legitimate senders almost always DKIM-sign. Absence is a yellow flag, especially for brand emails.",
    });
  }

  if (authResults.dmarc === "fail") {
    findings.push({
      id: "dmarc-fail",
      category: "header",
      severity: "high",
      title: "DMARC failed",
      detail:
        "The domain's published DMARC policy rejected this message. Treat the sender as forged.",
      evidence: authResults.raw ?? undefined,
    });
  }

  if (p.replyTo && p.fromAddress) {
    const replyDomain = domain(p.replyTo);
    const fromDomain = domain(p.fromAddress);
    if (
      replyDomain &&
      fromDomain &&
      replyDomain !== fromDomain &&
      !replyDomain.endsWith("." + fromDomain) &&
      !fromDomain.endsWith("." + replyDomain)
    ) {
      findings.push({
        id: "reply-to-mismatch",
        category: "header",
        severity: "medium",
        title: "Reply-To points to a different domain",
        detail: `Replies will be routed to ${replyDomain}, not the sender's ${fromDomain}. Common in business-email-compromise (BEC) scams.`,
        evidence: `Reply-To: ${p.replyTo} • From: ${p.fromAddress}`,
      });
    }
  }

  if (p.returnPath && p.fromAddress) {
    const rpDomain = domain(p.returnPath);
    const fromDomain = domain(p.fromAddress);
    if (
      rpDomain &&
      fromDomain &&
      rpDomain !== fromDomain &&
      !rpDomain.endsWith("." + fromDomain) &&
      !fromDomain.endsWith("." + rpDomain)
    ) {
      findings.push({
        id: "return-path-mismatch",
        category: "header",
        severity: "low",
        title: "Return-Path differs from From address",
        detail: `Bounces will go to ${rpDomain} instead of ${fromDomain}. Sometimes legitimate (mailing services), but worth noting.`,
        evidence: `Return-Path: ${p.returnPath}`,
      });
    }
  }

  const chain = p.receivedChain;
  if (chain.length > 0) {
    const origin = chain[0];
    if (chain.length === 1) {
      findings.push({
        id: "received-single-hop",
        category: "header",
        severity: "medium",
        title: "Email passed through only one relay",
        detail:
          "Legitimate mail usually traverses 2-5 servers (sender's outbound → MX → spam filter → inbox). A single Received header is unusual and often seen with hand-crafted phishing tools.",
        evidence: origin.raw,
      });
    }

    const privateIp = chain.find(
      (h) =>
        h.fromIp &&
        (h.fromIp.startsWith("10.") ||
          h.fromIp.startsWith("192.168.") ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(h.fromIp)),
    );
    if (privateIp && privateIp.fromIp) {
      findings.push({
        id: "received-private-ip",
        category: "header",
        severity: "medium",
        title: "Received chain exposes a private/internal IP",
        detail: `Hop ${privateIp.index} reports a private-range IP (${privateIp.fromIp}). Usually means the message was injected by a host that wasn't properly NATted — common with home-grown spam infrastructure.`,
        evidence: privateIp.raw,
      });
    }

    const bigGap = chain.find(
      (h) => typeof h.gapMs === "number" && h.gapMs > 60 * 60 * 1000,
    );
    if (bigGap && bigGap.gapMs !== null) {
      const hours = Math.round(bigGap.gapMs / (60 * 60 * 1000));
      findings.push({
        id: "received-big-gap",
        category: "header",
        severity: "low",
        title: `Unusual ${hours}h delay between SMTP relays`,
        detail:
          "Large gaps between adjacent Received hops can indicate the email was held in a queue, replayed, or had timestamps manipulated.",
        evidence: bigGap.raw,
      });
    }

    const negativeGap = chain.find(
      (h) => typeof h.gapMs === "number" && h.gapMs < -2 * 60 * 1000,
    );
    if (negativeGap) {
      findings.push({
        id: "received-time-travel",
        category: "header",
        severity: "medium",
        title: "Received chain timestamps go backwards",
        detail:
          "A later relay logged an earlier timestamp than the previous hop. Either clocks are badly skewed or someone forged the chain.",
        evidence: negativeGap.raw,
      });
    }
  }

  return findings;
}

function domain(a: string | null): string | null {
  if (!a) return null;
  const m = a.match(/@([^>\s;]+)/);
  return m ? m[1].toLowerCase() : null;
}
