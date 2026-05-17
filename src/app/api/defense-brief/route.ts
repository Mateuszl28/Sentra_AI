import { streamGeminiDefenseBrief } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_ENTRIES = 25;

type Entry = {
  label?: string;
  verdict?: string;
  kind?: string;
  riskScore?: number;
};

export async function POST(req: Request) {
  let payload: { entries?: Entry[] };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const entries = Array.isArray(payload.entries)
    ? payload.entries
        .filter(
          (e): e is Required<Entry> =>
            !!e &&
            typeof e.label === "string" &&
            typeof e.verdict === "string" &&
            typeof e.kind === "string" &&
            typeof e.riskScore === "number",
        )
        .slice(0, MAX_ENTRIES)
        .map((e) => ({
          label: e.label.slice(0, 120),
          verdict: e.verdict.slice(0, 20),
          kind: e.kind.slice(0, 20),
          riskScore: Math.max(0, Math.min(100, Math.round(e.riskScore))),
        }))
    : [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamGeminiDefenseBrief({ entries })) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Brief generation failed.";
        console.error("[/api/defense-brief]", err);
        controller.enqueue(encoder.encode(`\n\n[error] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
