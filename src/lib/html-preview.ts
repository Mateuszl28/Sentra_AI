/**
 * Minimal phishing-safe HTML sanitizer for the rendered-preview tab.
 *
 * Defense in depth:
 *   1. Output is rendered inside `<iframe sandbox="">` with no allow-* tokens,
 *      so scripts can't execute, forms can't submit, links can't navigate
 *      the parent, plugins are blocked. (Most important defense.)
 *   2. We strip `<script>` and `<style>` blocks, remove all `on*` attributes,
 *      replace `<iframe>`, `<object>`, `<embed>` with safe `<div>`, and rewrite
 *      every `<img src>` and `<source srcset>` to neutralized placeholders so
 *      attackers can't get a pixel callback that leaks the recipient's IP.
 *   3. Hrefs are kept visible but neutralized (`href="#blocked"`) and shown
 *      with the original URL in a `data-original` attribute and a hover ring.
 *
 * Trade-offs: we want the preview to look as close to the real attacker
 * rendering as possible (HTML / inline CSS) but with zero outbound network
 * activity.
 */

const VOID_DROP_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "applet",
  "audio",
  "video",
  "source",
  "track",
]);

export function sanitizeEmailHtml(raw: string): string {
  if (!raw) return "";

  let out = raw;

  // Remove script/style/etc. blocks entirely (greedy, robust to mixed case).
  for (const tag of VOID_DROP_TAGS) {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
    out = out.replace(re, "");
    // Self-closing or unmatched
    const re2 = new RegExp(`<${tag}\\b[^>]*/?>`, "gi");
    out = out.replace(re2, "");
  }

  // Strip on* event-handler attributes (`onclick`, `onerror`, etc.)
  out = out.replace(
    /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    "",
  );

  // Replace dangerous javascript:/data:/vbscript: URIs in href/src/action with
  // a neutralized marker.
  out = out.replace(
    /\b(href|src|srcset|action|formaction)\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\2/gi,
    `$1=$2#blocked-uri$2`,
  );

  // Neutralize <img src=…> so previews don't beacon back to the attacker.
  out = out.replace(/<img\b([^>]*)>/gi, (match, attrs: string) => {
    const original = (attrs.match(/\bsrc\s*=\s*("[^"]+"|'[^']+'|\S+)/i) ?? [
      "",
      "",
    ])[1]
      .replace(/^["']|["']$/g, "")
      .slice(0, 200);
    const alt = (attrs.match(/\balt\s*=\s*("[^"]*"|'[^']*'|\S+)/i) ?? [
      "",
      "image",
    ])[1]
      .replace(/^["']|["']$/g, "");
    const placeholder =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="60"><rect width="140" height="60" fill="#1e293b" rx="6"/><text x="70" y="34" text-anchor="middle" font-family="monospace" font-size="11" fill="#94a3b8">[image blocked]</text></svg>`,
      );
    return `<img src="${placeholder}" alt="${escapeAttr(alt)}" title="Original src: ${escapeAttr(original)}" style="opacity:0.6;border:1px dashed #475569;border-radius:6px;max-width:140px;height:auto" data-original="${escapeAttr(original)}">`;
  });

  // Neutralize <a href=…>: keep visible text and tooltip with original, but
  // make it inert. We do NOT obscure the URL — that's the whole point of the
  // preview ("the user would have clicked here").
  out = out.replace(/<a\b([^>]*)>/gi, (match, attrs: string) => {
    const hrefMatch = attrs.match(
      /\bhref\s*=\s*("[^"]+"|'[^']+'|\S+)/i,
    );
    const original = hrefMatch
      ? hrefMatch[1].replace(/^["']|["']$/g, "")
      : "";
    // Strip target/href/etc.
    const cleanedAttrs = attrs
      .replace(/\b(href|target|rel|formaction|action)\s*=\s*("[^"]*"|'[^']*'|\S+)/gi, "")
      .trim();
    return `<a href="#blocked-link" data-original-href="${escapeAttr(original)}" title="Sentra preview: link disabled. Real URL: ${escapeAttr(original)}" rel="noopener noreferrer" ${cleanedAttrs} style="text-decoration:underline dotted #ef4444 1px;text-underline-offset:2px;cursor:not-allowed">`;
  });

  // Neutralize <form> and <input>/<button[type=submit]>
  out = out.replace(/<form\b[^>]*>/gi, '<div data-was="form">');
  out = out.replace(/<\/form>/gi, "</div>");
  out = out.replace(/<button\b([^>]*)\btype\s*=\s*("submit"|'submit')([^>]*)>/gi, '<button$1type="button"$3 disabled>');
  out = out.replace(/<input\b([^>]*)>/gi, (match, attrs: string) => {
    // Keep the visual shape, prevent any action.
    return `<input${attrs} disabled aria-disabled="true">`;
  });

  return out;
}

function escapeAttr(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Wrap sanitized body in a minimal document with the Sentra preview shell:
 * a dark, neutral page that makes injected HTML stand out as "rendered email"
 * rather than a real browser tab.
 */
export function buildPreviewSrcDoc(sanitizedHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_self"><style>
:root { color-scheme: dark; }
html, body { margin: 0; padding: 0; background: #f8fafc; color: #0f172a; font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
body { padding: 18px; }
a[href="#blocked-link"] { pointer-events: none; }
</style></head><body>${sanitizedHtml}</body></html>`;
}
