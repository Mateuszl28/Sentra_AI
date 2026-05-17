import { NextResponse } from "next/server";
import { lookupDomainInfo } from "@/lib/domain-info";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const HOST_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = (searchParams.get("host") || "").trim().toLowerCase();
  if (!host || !HOST_RE.test(host) || host.length > 253) {
    return NextResponse.json({ error: "Invalid host." }, { status: 400 });
  }
  try {
    const info = await lookupDomainInfo(host);
    if (!info) {
      return NextResponse.json(
        { error: "Lookup unavailable.", host },
        { status: 503 },
      );
    }
    return NextResponse.json(info, {
      headers: { "cache-control": "public, max-age=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lookup failed." },
      { status: 500 },
    );
  }
}
