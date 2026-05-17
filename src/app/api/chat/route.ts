import { streamGeminiChat, type ChatMessage } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_RAW_BYTES = 200_000;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 12;

type ChatRequest = {
  rawEmail?: string;
  analysisSummary?: string;
  history?: ChatMessage[];
  message?: string;
};

export async function POST(req: Request) {
  let payload: ChatRequest;
  try {
    payload = (await req.json()) as ChatRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const rawEmail = (payload.rawEmail ?? "").trim();
  const analysisSummary = (payload.analysisSummary ?? "").trim();
  const message = (payload.message ?? "").trim();

  if (!rawEmail || !analysisSummary) {
    return new Response(
      JSON.stringify({
        error: "Missing rawEmail or analysisSummary context.",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }
  if (!message) {
    return new Response(JSON.stringify({ error: "Empty message." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response(
      JSON.stringify({
        error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars).`,
      }),
      { status: 413, headers: { "content-type": "application/json" } },
    );
  }
  if (Buffer.byteLength(rawEmail, "utf8") > MAX_RAW_BYTES) {
    return new Response(
      JSON.stringify({ error: "Email too large for chat context." }),
      { status: 413, headers: { "content-type": "application/json" } },
    );
  }

  const history: ChatMessage[] = Array.isArray(payload.history)
    ? payload.history
        .filter(
          (m): m is ChatMessage =>
            !!m &&
            (m.role === "user" || m.role === "model") &&
            typeof m.text === "string" &&
            m.text.length > 0,
        )
        .slice(-MAX_HISTORY)
    : [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamGeminiChat({
          rawEmail,
          analysisSummary,
          history,
          userMessage: message,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Chat failed.";
        console.error("[/api/chat]", err);
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
