import type { AnalysisResponse } from "@/lib/types";

const SHARE_VERSION = 1;
const MAX_RAW_FOR_SHARE = 18_000;

export type SharedPayload = {
  v: number;
  data: AnalysisResponse;
  rawEmail: string;
  sharedAt: number;
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 =
    typeof btoa === "function"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice(0, (4 - (b64.length % 4)) % 4);
  const bin =
    typeof atob === "function"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShare(data: AnalysisResponse, rawEmail: string): string {
  const payload: SharedPayload = {
    v: SHARE_VERSION,
    data,
    rawEmail: rawEmail.slice(0, MAX_RAW_FOR_SHARE),
    sharedAt: Date.now(),
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return toBase64Url(bytes);
}

export function decodeShare(hash: string): SharedPayload | null {
  try {
    const bytes = fromBase64Url(hash);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as SharedPayload;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.v !== SHARE_VERSION ||
      !parsed.data ||
      typeof parsed.rawEmail !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readShareFromHash(): SharedPayload | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("share=")) return null;
  return decodeShare(hash.slice("share=".length));
}

export function clearShareFromHash() {
  if (typeof window === "undefined") return;
  if (window.location.hash.startsWith("#share=")) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}
