import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sentra AI — AI Phishing Sentinel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "radial-gradient(900px 600px at 15% 0%, rgba(56,189,248,0.18), transparent), radial-gradient(700px 500px at 90% 100%, rgba(167,139,250,0.18), transparent), #050816",
          fontFamily: "Inter, sans-serif",
          color: "#e7ecf3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, #38bdf8 0%, #22d3ee 50%, #34d399 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px -20px rgba(56,189,248,0.6)",
            }}
          >
            <svg
              width="36"
              height="36"
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
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>
              Sentra <span style={{ color: "#94a3b8", fontSize: 22 }}>AI</span>
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                color: "#94a3b8",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              Phishing Sentinel
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            Stop guessing if an email is real.
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              background:
                "linear-gradient(90deg, #7dd3fc 0%, #67e8f9 40%, #6ee7b7 100%)",
              backgroundClip: "text",
              color: "transparent",
              WebkitBackgroundClip: "text",
            }}
          >
            Sentra reads it for you.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 18,
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Pill label="Analyzer" color="#7dd3fc" />
            <Pill label="URL" color="#a78bfa" />
            <Pill label="Compare" color="#f0abfc" />
            <Pill label="Train" color="#67e8f9" />
            <Pill label="Inbox" color="#6ee7b7" />
            <Pill label="Anatomy" color="#fcd34d" />
            <Pill label="Insights" color="#818cf8" />
          </div>
          <div style={{ fontFamily: "monospace", letterSpacing: 2 }}>
            Hack the Tech 2026
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 999,
        border: "1px solid rgba(148,163,184,0.2)",
        background: "rgba(15,23,42,0.5)",
        color: color,
        fontSize: 14,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: color,
        }}
      />
      {label}
    </div>
  );
}
