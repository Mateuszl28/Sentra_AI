/**
 * DNS over HTTPS via Cloudflare's 1.1.1.1 JSON API.
 * Free, no key, supports all record types.
 *
 * https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/
 */

const DOH_BASE = "https://cloudflare-dns.com/dns-query";
const TIMEOUT_MS = 3500;

type DohAnswer = { name: string; type: number; TTL: number; data: string };
type DohResponse = {
  Status: number;
  Answer?: DohAnswer[];
  Authority?: DohAnswer[];
};

type RecordType = "MX" | "TXT" | "NS" | "A" | "AAAA";

const TYPE_CODE: Record<RecordType, number> = {
  A: 1,
  NS: 2,
  TXT: 16,
  AAAA: 28,
  MX: 15,
};

export type DnsLookup = {
  type: RecordType;
  domain: string;
  records: string[];
  /** True if the response was successful but contained no answers. */
  empty: boolean;
};

async function query(domain: string, type: RecordType): Promise<DnsLookup> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `${DOH_BASE}?name=${encodeURIComponent(domain)}&type=${type}`,
      {
        headers: { accept: "application/dns-json" },
        signal: ac.signal,
        cache: "no-store",
      },
    );
    if (!res.ok) return { type, domain, records: [], empty: true };
    const data = (await res.json()) as DohResponse;
    const wanted = (data.Answer ?? []).filter(
      (a) => a.type === TYPE_CODE[type],
    );
    return {
      type,
      domain,
      records: wanted.map((a) => a.data),
      empty: wanted.length === 0,
    };
  } catch {
    return { type, domain, records: [], empty: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupMx(domain: string): Promise<DnsLookup> {
  return query(domain, "MX");
}

export async function lookupTxt(domain: string): Promise<DnsLookup> {
  return query(domain, "TXT");
}

/**
 * Parse an MX answer string ("10 mx.example.com.") into priority + host.
 */
export function parseMxRecord(raw: string): {
  priority: number;
  host: string;
} | null {
  const m = raw.match(/^(\d+)\s+(.+?)\.?$/);
  if (!m) return null;
  return { priority: parseInt(m[1], 10), host: m[2].toLowerCase() };
}

/**
 * Returns true if the MX set is RFC7505 "null MX" — explicit "this domain
 * does not accept email".
 */
export function isNullMx(records: string[]): boolean {
  if (records.length !== 1) return false;
  const parsed = parseMxRecord(records[0]);
  return parsed?.priority === 0 && (parsed.host === "" || parsed.host === ".");
}
