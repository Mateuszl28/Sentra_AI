/**
 * Free meta-RDAP via rdap.org — no key, no signup.
 * Returns the canonical registration date for a domain when available.
 */

const RDAP_BASE = "https://rdap.org/domain/";
const TIMEOUT_MS = 4000;

export type DomainInfo = {
  domain: string;
  registered: string | null;
  lastChanged: string | null;
  expires: string | null;
  registrar: string | null;
  status: string[];
  ageDays: number | null;
  /** True if RDAP succeeded but the registry returned no registration date. */
  unknown: boolean;
  mx: string[];
  mxNull: boolean;
};

type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapEntity = {
  roles?: string[];
  vcardArray?: unknown;
};
type RdapResponse = {
  events?: RdapEvent[];
  status?: string[];
  entities?: RdapEntity[];
};

function extractRegistrarFromEntities(entities: RdapEntity[] | undefined): string | null {
  if (!entities) return null;
  for (const e of entities) {
    if (!Array.isArray(e.roles) || !e.roles.includes("registrar")) continue;
    const vcard = e.vcardArray;
    if (
      Array.isArray(vcard) &&
      vcard.length >= 2 &&
      Array.isArray(vcard[1])
    ) {
      for (const entry of vcard[1] as unknown[]) {
        if (
          Array.isArray(entry) &&
          entry[0] === "fn" &&
          typeof entry[3] === "string"
        ) {
          return entry[3];
        }
      }
    }
  }
  return null;
}

import { isNullMx, lookupMx, parseMxRecord } from "./dns";

export async function lookupDomainInfo(host: string): Promise<DomainInfo | null> {
  const cleaned = host
    .toLowerCase()
    .replace(/^\*\./, "")
    .replace(/^xn--/, "xn--") // RDAP accepts punycode directly
    .replace(/^\.|\.$/g, "");
  if (!cleaned || !cleaned.includes(".")) return null;

  // Use the registrable domain only — RDAP queries are by registered domain, not by subdomain.
  const parts = cleaned.split(".");
  const registrable = parts.length >= 2 ? parts.slice(-2).join(".") : cleaned;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const [rdapRes, mxLookup] = await Promise.all([
      fetch(`${RDAP_BASE}${registrable}`, {
        headers: { accept: "application/rdap+json" },
        signal: ac.signal,
        cache: "no-store",
      }).catch(() => null),
      lookupMx(registrable).catch(() => null),
    ]);

    if (!rdapRes || !rdapRes.ok) return null;
    const data = (await rdapRes.json()) as RdapResponse;

    const events = Array.isArray(data.events) ? data.events : [];
    const findEvent = (action: string) =>
      events.find((e) => (e.eventAction || "").toLowerCase() === action)
        ?.eventDate ?? null;

    const registered = findEvent("registration");
    const lastChanged = findEvent("last changed") ?? findEvent("last update");
    const expires = findEvent("expiration");
    const registrar = extractRegistrarFromEntities(data.entities);

    let ageDays: number | null = null;
    if (registered) {
      const ts = Date.parse(registered);
      if (Number.isFinite(ts)) {
        ageDays = Math.max(0, Math.floor((Date.now() - ts) / 86_400_000));
      }
    }

    const mxRecords = mxLookup?.records ?? [];
    const mxParsed = mxRecords
      .map(parseMxRecord)
      .filter((p): p is { priority: number; host: string } => p !== null)
      .sort((a, b) => a.priority - b.priority)
      .map((p) => `${p.priority} ${p.host}`);

    return {
      domain: registrable,
      registered,
      lastChanged,
      expires,
      registrar,
      status: Array.isArray(data.status) ? data.status : [],
      ageDays,
      unknown: !registered,
      mx: mxParsed,
      mxNull: isNullMx(mxRecords),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
