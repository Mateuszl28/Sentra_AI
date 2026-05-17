import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const VERDICT_COLORS: Record<string, { text: string; glow: string }> = {
  SAFE: { text: "#34d399", glow: "rgba(52,211,153,0.35)" },
  SUSPICIOUS: { text: "#fbbf24", glow: "rgba(251,191,36,0.35)" },
  PHISHING: { text: "#fb7185", glow: "rgba(244,63,94,0.4)" },
  MALICIOUS: { text: "#fb7185", glow: "rgba(244,63,94,0.4)" },
};

type CardPayload = {
  v: string;
  s: number;
  sum: string;
  flags: string[];
  sender: string;
  subject: string;
  agreement: string | null;
};

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice(0, (4 - (b64.length % 4)) % 4);
  return atob(padded);
}

function decodePayload(input: string | null): CardPayload | null {
  if (!input) return null;
  try {
    const bin = fromBase64Url(input);
    const utf8 = decodeURIComponent(escape(bin));
    const parsed = JSON.parse(utf8) as CardPayload;
    if (
      typeof parsed.v !== "string" ||
      typeof parsed.s !== "number" ||
      typeof parsed.sum !== "string" ||
      !Array.isArray(parsed.flags)
    ) {
      return null;
    }
    return {
      v: parsed.v.slice(0, 16),
      s: Math.max(0, Math.min(100, Math.round(parsed.s))),
      sum: parsed.sum.slice(0, 240),
      flags: parsed.flags.slice(0, 3).map((f) => String(f).slice(0, 60)),
      sender: String(parsed.sender ?? "").slice(0, 80),
      subject: String(parsed.subject ?? "").slice(0, 100),
      agreement: parsed.agreement ? String(parsed.agreement).slice(0, 40) : null,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const payload =
    decodePayload(url.searchParams.get("d")) ??
    ({
      v: "SAFE",
      s: 0,
      sum: "No data — pass ?d=<base64url JSON> to render a verdict card.",
      flags: [],
      sender: "",
      subject: "",
      agreement: null,
    } as CardPayload);

  const palette = VERDICT_COLORS[payload.v] ?? VERDICT_COLORS.SUSPICIOUS;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 56,
          background:
            "radial-gradient(900px 600px at 15% 0%, rgba(56,189,248,0.18), transparent), radial-gradient(700px 500px at 90% 100%, rgba(167,139,250,0.16), transparent), #050816",
          fontFamily: "Inter, sans-serif",
          color: "#e7ecf3",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #34d399 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#020617"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2.5 4 5.5v6.4c0 4.6 3.3 8.9 8 9.6 4.7-.7 8-5 8-9.6V5.5l-8-3Z" />
              <path d="m9 12.2 2.2 2.2L15 10.7" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>
              Sentra <span style={{ color: "#94a3b8", fontSize: 18 }}>AI</span>
            </div>
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "#94a3b8",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Verdict Card
            </div>
          </div>
        </div>

        {/* Verdict block */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            gap: 36,
          }}
        >
          {/* Gauge */}
          <div
            style={{
              position: "relative",
              width: 200,
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 6,
                borderRadius: 999,
                background: `radial-gradient(circle, ${palette.glow}, transparent 65%)`,
                filter: "blur(20px)",
              }}
            />
            <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="14"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke={palette.text}
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(payload.s / 100) * 502.6} 502.6`}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 60,
                  fontWeight: 700,
                  color: palette.text,
                  lineHeight: 1,
                }}
              >
                {payload.s}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "#94a3b8",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                Risk score
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 18px",
                borderRadius: 999,
                background: "rgba(15,23,42,0.7)",
                border: `1px solid ${palette.text}55`,
                color: palette.text,
                alignSelf: "flex-start",
                fontWeight: 700,
                fontSize: 22,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: palette.text,
                }}
              />
              {payload.v}
            </div>

            {payload.agreement ? (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  color: "#cbd5e1",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {payload.agreement}
              </div>
            ) : null}

            <div
              style={{
                marginTop: 18,
                fontSize: 24,
                lineHeight: 1.3,
                color: "#e7ecf3",
                maxWidth: 760,
              }}
            >
              {payload.sum}
            </div>
          </div>
        </div>

        {/* Sender row */}
        {payload.sender || payload.subject ? (
          <div
            style={{
              marginTop: 28,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(148,163,184,0.18)",
              display: "flex",
              gap: 24,
              fontSize: 16,
              color: "#cbd5e1",
            }}
          >
            {payload.sender ? (
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#64748b" }}>From</span>
                <span style={{ fontFamily: "monospace" }}>{payload.sender}</span>
              </div>
            ) : null}
            {payload.subject ? (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                <span style={{ color: "#64748b" }}>Subject</span>
                <span style={{ flex: 1 }}>{payload.subject}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Flags */}
        {payload.flags.length > 0 ? (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#94a3b8",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Top red flags
            </div>
            {payload.flags.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 18,
                  color: "#e2e8f0",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${palette.text}26`,
                    color: palette.text,
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </div>
                {f}
              </div>
            ))}
          </div>
        ) : null}

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            color: "#94a3b8",
          }}
        >
          <span>Two layers · heuristics + Gemini 2.5 Flash</span>
          <span style={{ fontFamily: "monospace", letterSpacing: 2 }}>
            Hack the Tech 2026
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
