import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import type {
  HeuristicFinding,
  LlmAnalysis,
  ParsedEmail,
  UrlFinding,
  UrlLlmAnalysis,
  UrlParts,
} from "@/lib/types";

const MODEL_ID = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: {
      type: SchemaType.STRING,
      description: "Overall verdict: SAFE, SUSPICIOUS, or PHISHING.",
      enum: ["SAFE", "SUSPICIOUS", "PHISHING"],
    },
    riskScore: {
      type: SchemaType.NUMBER,
      description: "Numeric risk from 0 (safe) to 100 (definite phishing).",
    },
    summary: {
      type: SchemaType.STRING,
      description:
        "One or two-sentence executive summary of the verdict, for the user's eyes.",
    },
    redFlags: {
      type: SchemaType.ARRAY,
      description:
        "Concrete reasons this email is dangerous, ordered most-to-least severe. Reference real evidence from the email.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: {
            type: SchemaType.STRING,
            description: "Short label (3-7 words), no period.",
          },
          severity: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high", "info"],
          },
          explanation: {
            type: SchemaType.STRING,
            description:
              "2-4 sentences in plain English explaining *why* this is a red flag and how the attacker uses it.",
          },
          evidence: {
            type: SchemaType.STRING,
            description:
              "Direct quote, header value, URL, or filename from the email that demonstrates the red flag.",
          },
        },
        required: ["title", "severity", "explanation"],
      },
    },
    legitimateSignals: {
      type: SchemaType.ARRAY,
      description:
        "Observations that argue in favor of legitimacy. Empty array if none.",
      items: { type: SchemaType.STRING },
    },
    recommendedActions: {
      type: SchemaType.ARRAY,
      description:
        "Concrete actions the user should take right now, ordered by priority.",
      items: { type: SchemaType.STRING },
    },
    educationalTakeaway: {
      type: SchemaType.STRING,
      description:
        "One memorable lesson the reader can use next time. Avoid jargon.",
    },
  },
  required: [
    "verdict",
    "riskScore",
    "summary",
    "redFlags",
    "legitimateSignals",
    "recommendedActions",
    "educationalTakeaway",
  ],
};

const SYSTEM_INSTRUCTION = `You are Sentra AI, a senior email-security analyst.
Your job: judge whether the supplied email is phishing, suspicious, or safe, and explain it so a non-technical user can act.

Rules:
- Be specific. Quote the email when listing red flags.
- Combine the pre-computed heuristic findings with your own reading of headers, sender, links, language, and any attachments.
- Do not invent facts that aren't in the message.
- If the email looks legitimate, say so confidently and list the signals that support it.
- Severity scale: high = strong phishing indicator, medium = clearly suspicious, low = mildly concerning. "info" only for context.
- riskScore must roughly track verdict: SAFE 0-25, SUSPICIOUS 26-65, PHISHING 66-100.
- educationalTakeaway should teach a transferable rule, not restate the verdict.
- Output JSON only, matching the provided schema.`;

function buildUserPrompt(parsed: ParsedEmail, findings: HeuristicFinding[]) {
  const lines: string[] = [];
  lines.push("# Email metadata");
  lines.push(`From: ${parsed.fromHeader ?? "(missing)"}`);
  lines.push(`Reply-To: ${parsed.replyTo ?? "(none)"}`);
  lines.push(`Return-Path: ${parsed.returnPath ?? "(none)"}`);
  lines.push(`Subject: ${parsed.subject ?? "(none)"}`);
  lines.push(`Date: ${parsed.date ?? "(none)"}`);
  lines.push(
    `Authentication-Results: SPF=${parsed.authResults.spf}, DKIM=${parsed.authResults.dkim}, DMARC=${parsed.authResults.dmarc}`,
  );

  lines.push("");
  lines.push("# Links extracted");
  if (parsed.links.length === 0) {
    lines.push("(no links)");
  } else {
    for (const l of parsed.links.slice(0, 25)) {
      lines.push(`- "${truncate(l.anchorText, 80)}" → ${l.href}`);
    }
    if (parsed.links.length > 25) {
      lines.push(`… and ${parsed.links.length - 25} more`);
    }
  }

  lines.push("");
  lines.push("# Attachments");
  if (parsed.attachments.length === 0) {
    lines.push("(none)");
  } else {
    for (const a of parsed.attachments) {
      lines.push(
        `- ${a.filename} (${a.contentType})${a.riskyExtension ? " ⚠ risky extension" : ""}`,
      );
    }
  }

  lines.push("");
  lines.push("# Pre-computed heuristic findings");
  if (findings.length === 0) {
    lines.push("(none triggered)");
  } else {
    for (const f of findings) {
      lines.push(
        `- [${f.severity.toUpperCase()}][${f.category}] ${f.title} — ${f.detail}${
          f.evidence ? ` // evidence: ${truncate(f.evidence, 200)}` : ""
        }`,
      );
    }
  }

  lines.push("");
  lines.push("# Email body (text)");
  lines.push(truncate(parsed.bodyText || "(empty)", 6000));

  if (parsed.bodyHtml) {
    lines.push("");
    lines.push("# Email body (HTML, truncated)");
    lines.push(truncate(parsed.bodyHtml, 4000));
  }

  return lines.join("\n");
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n) + `\n…[truncated ${s.length - n} chars]`;
}

export async function runGeminiAnalysis(
  parsed: ParsedEmail,
  findings: HeuristicFinding[],
): Promise<{ analysis: LlmAnalysis; latencyMs: number; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or your Vercel project settings.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const prompt = buildUserPrompt(parsed, findings);
  const started = Date.now();
  const result = await model.generateContent(prompt);
  const latencyMs = Date.now() - started;
  const text = result.response.text();

  let parsedJson: LlmAnalysis;
  try {
    parsedJson = JSON.parse(text) as LlmAnalysis;
  } catch {
    throw new Error(
      `Gemini returned non-JSON response: ${text.slice(0, 200)}…`,
    );
  }

  parsedJson.riskScore = clamp(Math.round(parsedJson.riskScore), 0, 100);
  if (!parsedJson.redFlags) parsedJson.redFlags = [];
  if (!parsedJson.legitimateSignals) parsedJson.legitimateSignals = [];
  if (!parsedJson.recommendedActions) parsedJson.recommendedActions = [];

  return { analysis: parsedJson, latencyMs, model: MODEL_ID };
}

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

const URL_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: {
      type: SchemaType.STRING,
      enum: ["SAFE", "SUSPICIOUS", "MALICIOUS"],
      description: "Verdict for the URL only — no email context available.",
    },
    riskScore: {
      type: SchemaType.NUMBER,
      description: "0 (safe) to 100 (almost certainly malicious).",
    },
    summary: {
      type: SchemaType.STRING,
      description: "One- or two-sentence verdict in plain English.",
    },
    redFlags: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          severity: {
            type: SchemaType.STRING,
            enum: ["low", "medium", "high", "info"],
          },
          explanation: { type: SchemaType.STRING },
          evidence: { type: SchemaType.STRING },
        },
        required: ["title", "severity", "explanation"],
      },
    },
    legitimateSignals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    recommendedActions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    educationalTakeaway: { type: SchemaType.STRING },
  },
  required: [
    "verdict",
    "riskScore",
    "summary",
    "redFlags",
    "legitimateSignals",
    "recommendedActions",
    "educationalTakeaway",
  ],
};

const URL_SYSTEM_INSTRUCTION = `You are Sentra AI, a senior web-security analyst.
Your job: judge whether a single URL is safe, suspicious, or malicious — without visiting it. You only see the URL string and pre-computed structural heuristics.

Rules:
- Be specific. Refer to concrete parts of the URL (host, TLD, path, query) in your explanations.
- Heuristics are inputs, not gospel. You may agree, disagree, or add context.
- riskScore must roughly track verdict: SAFE 0-25, SUSPICIOUS 26-65, MALICIOUS 66-100.
- A clean URL on a verified brand domain is SAFE — say so confidently rather than hedging.
- Never visit the URL or assume anything about its content beyond what the string itself suggests.
- educationalTakeaway should teach a transferable rule, not restate the verdict.
- Output JSON only, matching the provided schema.`;

function buildUrlPrompt(parts: UrlParts, findings: UrlFinding[]) {
  const lines: string[] = [];
  lines.push("# URL");
  lines.push(parts.normalized);
  lines.push("");
  lines.push("# Parsed structure");
  lines.push(`Protocol: ${parts.protocol}`);
  lines.push(
    `Hostname: ${parts.hostname}${
      parts.unicodeHostname !== parts.hostname
        ? ` (unicode: ${parts.unicodeHostname})`
        : ""
    }`,
  );
  lines.push(`Registrable domain: ${parts.registrableDomain}`);
  lines.push(`TLD: .${parts.tld || "(none)"}`);
  lines.push(`Subdomain depth: ${parts.subdomainDepth}`);
  if (parts.port) lines.push(`Port: ${parts.port}`);
  if (parts.username) lines.push(`Username in URL: ${parts.username}`);
  lines.push(`Path: ${parts.pathname || "/"}`);
  if (parts.search) lines.push(`Query: ${parts.search.slice(0, 200)}`);
  if (parts.hash) lines.push(`Fragment: ${parts.hash.slice(0, 100)}`);

  lines.push("");
  lines.push("# Pre-computed structural findings");
  if (findings.length === 0) {
    lines.push("(none triggered)");
  } else {
    for (const f of findings) {
      lines.push(
        `- [${f.severity.toUpperCase()}] ${f.title} — ${f.detail}${
          f.evidence ? ` // evidence: ${f.evidence}` : ""
        }`,
      );
    }
  }

  return lines.join("\n");
}

const CHAT_SYSTEM_INSTRUCTION = `You are Sentra AI's email-security tutor.
You are continuing a conversation about ONE specific email that the user pasted and the verdict your colleague (the analyzer) already produced.

Rules:
- Stay strictly grounded in the supplied email content and analysis. If the user asks about something that's not in the email or analysis, say so plainly.
- Tone: friendly senior analyst. Short, direct, concrete. No corporate hedging.
- 1-3 short paragraphs by default. Lists only when genuinely helpful.
- Reference real evidence from the email when relevant — quote headers/URLs verbatim.
- If asked something dangerous (e.g. "help me write a phishing email"), refuse briefly and redirect to defensive learning.
- Never claim you can browse, fetch URLs, or check whois — you can't.
- No markdown headings. Plain prose. Backticks for code/URLs/headers are fine.`;

export type ChatMessage = { role: "user" | "model"; text: string };

export async function* streamGeminiChat(args: {
  rawEmail: string;
  analysisSummary: string;
  history: ChatMessage[];
  userMessage: string;
}): AsyncGenerator<string, void, void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or your Vercel project settings.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: CHAT_SYSTEM_INSTRUCTION,
    generationConfig: { temperature: 0.4 },
  });

  const context = [
    "# Pasted email (verbatim, truncated)",
    truncate(args.rawEmail, 8000),
    "",
    "# Prior analysis (your colleague's verdict)",
    args.analysisSummary,
  ].join("\n");

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: context }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I have the email and my colleague's verdict in mind. Go ahead.",
          },
        ],
      },
      ...args.history.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    ],
  });

  const stream = await chat.sendMessageStream(args.userMessage);
  for await (const chunk of stream.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

export async function runGeminiUrlAnalysis(
  parts: UrlParts,
  findings: UrlFinding[],
): Promise<{ analysis: UrlLlmAnalysis; latencyMs: number; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or your Vercel project settings.",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    systemInstruction: URL_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: URL_RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  });

  const prompt = buildUrlPrompt(parts, findings);
  const started = Date.now();
  const result = await model.generateContent(prompt);
  const latencyMs = Date.now() - started;
  const text = result.response.text();

  let parsedJson: UrlLlmAnalysis;
  try {
    parsedJson = JSON.parse(text) as UrlLlmAnalysis;
  } catch {
    throw new Error(
      `Gemini returned non-JSON response: ${text.slice(0, 200)}…`,
    );
  }

  parsedJson.riskScore = clamp(Math.round(parsedJson.riskScore), 0, 100);
  if (!parsedJson.redFlags) parsedJson.redFlags = [];
  if (!parsedJson.legitimateSignals) parsedJson.legitimateSignals = [];
  if (!parsedJson.recommendedActions) parsedJson.recommendedActions = [];

  return { analysis: parsedJson, latencyMs, model: MODEL_ID };
}
