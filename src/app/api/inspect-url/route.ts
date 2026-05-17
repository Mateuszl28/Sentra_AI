import { NextResponse } from "next/server";
import { runGeminiUrlAnalysis } from "@/lib/gemini";
import {
  UrlParseError,
  inspectUrl,
  parseUserUrl,
} from "@/lib/url-inspector";
import type { UrlInspectionResponse } from "@/lib/types";

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
    const { analysis, latencyMs, model } = await runGeminiUrlAnalysis(
      parts,
      findings,
    );

    const response: UrlInspectionResponse = {
      parts,
      heuristicFindings: findings,
      heuristicScore: score,
      analysis,
      meta: { model, latencyMs },
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Inspection failed.";
    console.error("[/api/inspect-url]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
