import PostalMime from "postal-mime";
import type {
  AuthStatus,
  ParsedAttachment,
  ParsedEmail,
  ParsedLink,
  ReceivedHop,
} from "@/lib/types";

const RISKY_EXTENSIONS = new Set([
  "exe",
  "scr",
  "vbs",
  "vbe",
  "js",
  "jse",
  "wsf",
  "wsh",
  "ps1",
  "bat",
  "cmd",
  "com",
  "pif",
  "lnk",
  "hta",
  "docm",
  "xlsm",
  "pptm",
  "dotm",
  "xltm",
  "iso",
  "img",
  "jar",
  "msi",
]);

function extOf(filename: string): string {
  const m = filename.toLowerCase().match(/\.([^.]+)$/);
  return m ? m[1] : "";
}

function parseAddress(header: string | null | undefined): {
  displayName: string | null;
  address: string | null;
} {
  if (!header) return { displayName: null, address: null };
  const trimmed = header.trim();
  const angle = trimmed.match(/^(.*?)<([^>]+)>\s*$/);
  if (angle) {
    const name = angle[1].trim().replace(/^"|"$/g, "").trim();
    return { displayName: name || null, address: angle[2].trim() };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { displayName: null, address: trimmed };
  }
  return { displayName: trimmed || null, address: null };
}

function domainOf(address: string | null): string | null {
  if (!address) return null;
  const at = address.lastIndexOf("@");
  if (at === -1) return null;
  return address.slice(at + 1).toLowerCase().replace(/[>;]+$/, "").trim();
}

function parseAuthResults(raw: string | null | undefined) {
  const result: ParsedEmail["authResults"] = {
    spf: "unknown",
    dkim: "unknown",
    dmarc: "unknown",
    raw: raw ?? null,
  };
  if (!raw) return result;
  const lower = raw.toLowerCase();
  const grab = (key: string): AuthStatus => {
    const m = lower.match(new RegExp(`${key}=([a-z]+)`));
    if (!m) return "unknown";
    const v = m[1];
    if (
      v === "pass" ||
      v === "fail" ||
      v === "softfail" ||
      v === "neutral" ||
      v === "none" ||
      v === "temperror" ||
      v === "permerror"
    )
      return v;
    return "unknown";
  };
  result.spf = grab("spf");
  result.dkim = grab("dkim");
  result.dmarc = grab("dmarc");
  return result;
}

function extractLinksFromHtml(html: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1].trim();
    const anchorRaw = m[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:"))
      continue;
    let hostname = "";
    try {
      const u = new URL(href, "https://placeholder.invalid");
      hostname = u.hostname;
    } catch {
      hostname = href;
    }
    const isMismatch = looksLikeUrl(anchorRaw) && hostHints(anchorRaw, hostname);
    links.push({ href, anchorText: anchorRaw, hostname, isMismatch });
  }
  return links;
}

function extractLinksFromText(text: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const re = /https?:\/\/[^\s<>"')]+/gi;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const href = m[0].replace(/[.,;:!?)]+$/, "");
    if (seen.has(href)) continue;
    seen.add(href);
    let hostname = "";
    try {
      hostname = new URL(href).hostname;
    } catch {
      hostname = href;
    }
    links.push({ href, anchorText: href, hostname, isMismatch: false });
  }
  return links;
}

function looksLikeUrl(s: string): boolean {
  return /(?:https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(s);
}

function hostHints(anchor: string, actualHost: string): boolean {
  const m = anchor.match(/(?:https?:\/\/)?([a-z0-9.-]+\.[a-z]{2,})/i);
  if (!m) return false;
  const claimed = m[1].toLowerCase();
  const actual = actualHost.toLowerCase();
  if (!actual) return false;
  if (claimed === actual) return false;
  if (actual.endsWith("." + claimed)) return false;
  if (claimed.endsWith("." + actual)) return false;
  return true;
}

function parseReceivedChain(
  headers: { key?: string; value?: unknown }[] | undefined,
): ReceivedHop[] {
  if (!headers) return [];
  const rawHops: string[] = [];
  for (const h of headers) {
    if ((h.key || "").toLowerCase() !== "received") continue;
    if (typeof h.value === "string") rawHops.push(h.value);
  }
  // Topmost Received: header is the most-recent hop. Reverse so index 0 = origin.
  const ordered = [...rawHops].reverse();
  const hops: ReceivedHop[] = ordered.map((raw, i) => {
    const fromMatch = raw.match(/from\s+([^\s(]+)(?:\s*\(([^)]+)\))?/i);
    const byMatch = raw.match(/\bby\s+([^\s(]+)/i);
    const withMatch = raw.match(/\bwith\s+([A-Z0-9.+_-]+)/i);
    const ipMatch =
      raw.match(/\[\s*((?:\d{1,3}\.){3}\d{1,3})\s*\]/) ??
      raw.match(/\(\s*((?:\d{1,3}\.){3}\d{1,3})\s*\)/) ??
      raw.match(/\(([0-9a-fA-F:]{2,})\)/);
    const semiIdx = raw.lastIndexOf(";");
    const dateStr = semiIdx >= 0 ? raw.slice(semiIdx + 1).trim() : null;
    const ts = dateStr ? Date.parse(dateStr) : NaN;

    return {
      index: i,
      raw: raw.replace(/\s+/g, " ").trim(),
      fromHost: fromMatch ? fromMatch[1] : null,
      fromIp: ipMatch ? ipMatch[1] : null,
      byHost: byMatch ? byMatch[1] : null,
      protocol: withMatch ? withMatch[1] : null,
      date: dateStr,
      timestamp: Number.isFinite(ts) ? ts : null,
      gapMs: null,
    };
  });

  for (let i = 1; i < hops.length; i++) {
    const prev = hops[i - 1].timestamp;
    const cur = hops[i].timestamp;
    if (prev !== null && cur !== null) hops[i].gapMs = cur - prev;
  }

  return hops;
}

export async function parseEmail(raw: string): Promise<ParsedEmail> {
  const parser = new PostalMime();
  const email = await parser.parse(raw);

  const fromHeader =
    email.from?.name || email.from?.address
      ? `${email.from?.name ? `"${email.from.name}" ` : ""}${
          email.from?.address ? `<${email.from.address}>` : ""
        }`.trim()
      : null;

  const { displayName: fromDisplayName, address: fromAddress } = email.from
    ? {
        displayName: email.from.name || null,
        address: email.from.address || null,
      }
    : parseAddress(null);

  const replyTo =
    email.replyTo && email.replyTo.length > 0
      ? email.replyTo[0].address || null
      : null;

  const returnPathHeader = email.headers?.find(
    (h) => h.key?.toLowerCase() === "return-path",
  );
  const authResultsHeader = email.headers?.find(
    (h) => h.key?.toLowerCase() === "authentication-results",
  );

  const bodyText = email.text || "";
  const bodyHtml = email.html || null;

  const htmlLinks = bodyHtml ? extractLinksFromHtml(bodyHtml) : [];
  const textLinks = extractLinksFromText(bodyText);
  const linkMap = new Map<string, ParsedLink>();
  for (const l of [...htmlLinks, ...textLinks]) {
    if (!linkMap.has(l.href)) linkMap.set(l.href, l);
  }

  const attachments: ParsedAttachment[] = (email.attachments || []).map((a) => {
    const filename = a.filename || "attachment";
    return {
      filename,
      contentType: a.mimeType || "application/octet-stream",
      riskyExtension: RISKY_EXTENSIONS.has(extOf(filename)),
    };
  });

  return {
    raw,
    fromHeader,
    fromDisplayName,
    fromAddress,
    fromDomain: domainOf(fromAddress),
    replyTo,
    returnPath:
      typeof returnPathHeader?.value === "string"
        ? returnPathHeader.value
        : null,
    subject: email.subject || null,
    date: email.date || null,
    toHeader:
      email.to && email.to.length > 0
        ? email.to.map((t) => t.address).filter(Boolean).join(", ")
        : null,
    authResults: parseAuthResults(
      typeof authResultsHeader?.value === "string"
        ? authResultsHeader.value
        : null,
    ),
    bodyText,
    bodyHtml,
    links: Array.from(linkMap.values()),
    attachments,
    receivedChain: parseReceivedChain(email.headers),
  };
}

export function exportDomain(address: string | null): string | null {
  return domainOf(address);
}
