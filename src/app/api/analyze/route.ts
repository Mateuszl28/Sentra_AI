import { NextResponse } from "next/server";
import { computeAgreement } from "@/lib/agreement";
import { runHeuristics } from "@/lib/heuristics";
import { runGeminiAnalysis } from "@/lib/gemini";
import type { AnalysisResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_EMAIL_BYTES = 200_000;

export async function POST(req: Request) {
  let payload: { raw?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = (payload.raw ?? "").trim();
  if (!raw) {
    return NextResponse.json(
      { error: "Provide the email under the `raw` field." },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(raw, "utf8") > MAX_EMAIL_BYTES) {
    return NextResponse.json(
      {
        error: `Email is too large (max ${MAX_EMAIL_BYTES} bytes). Paste headers + body only.`,
      },
      { status: 413 },
    );
  }

  try {
    const { parsed, findings, heuristicScore } = await runHeuristics(raw);
    const { analysis, latencyMs, model } = await runGeminiAnalysis(
      parsed,
      findings,
    );
    const agreement = computeAgreement(heuristicScore, analysis);

    const response: AnalysisResponse = {
      parsed: {
        fromHeader: parsed.fromHeader,
        fromDisplayName: parsed.fromDisplayName,
        fromAddress: parsed.fromAddress,
        fromDomain: parsed.fromDomain,
        replyTo: parsed.replyTo,
        subject: parsed.subject,
        date: parsed.date,
        authResults: parsed.authResults,
        linkCount: parsed.links.length,
        attachmentCount: parsed.attachments.length,
        receivedChain: parsed.receivedChain,
      },
      heuristicFindings: findings,
      heuristicScore,
      analysis,
      agreement,
      meta: { model, latencyMs },
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    console.error("[/api/analyze]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
