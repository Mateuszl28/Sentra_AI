import { NextResponse } from "next/server";
import { lookupDomainInfo, type DomainInfo } from "@/lib/domain-info";
import { runGeminiUrlAnalysis } from "@/lib/gemini";
import {
  UrlParseError,
  inspectUrl,
  parseUserUrl,
} from "@/lib/url-inspector";
import type { UrlFinding, UrlInspectionResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_URL_LENGTH = 2048;

export async function POST(req: Request) {
  let payload: { url?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (payload.url ?? "").trim();
  if (!raw) {
    return NextResponse.json(
      { error: "Provide the URL under the `url` field." },
      { status: 400 },
    );
  }
  if (raw.length > MAX_URL_LENGTH) {
    return NextResponse.json(
      { error: `URL is too long (max ${MAX_URL_LENGTH} characters).` },
      { status: 413 },
    );
  }

  let parts;
  try {
    parts = parseUserUrl(raw);
  } catch (err) {
    const message =
      err instanceof UrlParseError ? err.message : "Could not parse URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { findings, score } = inspectUrl(parts);

    // Domain-age lookup runs in parallel with Gemini.
    const [domainInfo, gemini] = await Promise.all([
      lookupDomainInfo(parts.registrableDomain).catch(() => null),
      runGeminiUrlAnalysis(parts, findings),
    ]);

    const ageFindings = domainAgeFindings(domainInfo);
    const allFindings = [...findings, ...ageFindings];

    const response: UrlInspectionResponse & {
      domainInfo: DomainInfo | null;
    } = {
      parts,
      heuristicFindings: allFindings,
      heuristicScore: score,
      analysis: gemini.analysis,
      meta: { model: gemini.model, latencyMs: gemini.latencyMs },
      domainInfo,
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Inspection failed.";
    console.error("[/api/inspect-url]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function domainAgeFindings(info: DomainInfo | null): UrlFinding[] {
  if (!info) return [];
  const out: UrlFinding[] = [];

  if (info.mxNull) {
    out.push({
      id: "domain-null-mx",
      severity: "high",
      title: "Domain publishes a Null-MX (RFC 7505)",
      detail:
        "The domain explicitly says it doesn't accept any email. Combined with an HTTP link, this is a strong tell that the domain exists only to host a fake login page.",
      evidence: info.domain,
    });
  } else if (
    info.mx.length === 0 &&
    info.registered // only flag if we know it's a real domain, not a lookup miss
  ) {
    out.push({
      id: "domain-no-mx",
      severity: "low",
      title: "Domain has no MX records",
      detail:
        "Most legitimate brand domains receive email at the same root. Lack of MX isn't conclusive, but combined with other signals points to throwaway phishing infrastructure.",
      evidence: info.domain,
    });
  }

  if (info.ageDays === null) return out;
  const age = info.ageDays;
  if (age < 7) {
    out.push({
      id: "domain-very-fresh",
      severity: "high",
      title: `Domain registered ${age} ${age === 1 ? "day" : "days"} ago`,
      detail:
        "Brand-new domains are the #1 phishing infrastructure tell. Legitimate companies don't rotate their own domains overnight. If a real brand contacts you, the domain has typically existed for years.",
      evidence: `${info.domain} · registered ${info.registered}${info.registrar ? ` via ${info.registrar}` : ""}`,
    });
  } else if (age < 30) {
    out.push({
      id: "domain-fresh",
      severity: "medium",
      title: `Domain registered ${age} days ago`,
      detail:
        "Less than a month old. Combined with brand impersonation, urgency, or unusual TLD, this is a strong phishing signal.",
      evidence: `${info.domain} · registered ${info.registered}`,
    });
  } else if (age < 180) {
    out.push({
      id: "domain-young",
      severity: "low",
      title: `Domain registered ${age} days ago`,
      detail:
        "Less than 6 months old. Not damning on its own — many legitimate startups are also young — but worth corroborating with other signals.",
    });
  }
  return out;
}
