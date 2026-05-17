import type { AnalysisResponse } from "./types";

export function buildMarkdownReport(data: AnalysisResponse): string {
  const { analysis, parsed, meta } = data;
  const lines: string[] = [];
  lines.push(`# Sentra AI — Email Analysis`);
  lines.push("");
  lines.push(`**Verdict:** ${analysis.verdict} · Risk score **${analysis.riskScore}/100**`);
  lines.push("");
  lines.push(`> ${analysis.summary}`);
  lines.push("");
  lines.push(`## Metadata`);
  lines.push(`- From: \`${parsed.fromAddress ?? "—"}\``);
  lines.push(`- Subject: ${parsed.subject ?? "—"}`);
  lines.push(
    `- SPF / DKIM / DMARC: \`${parsed.authResults.spf}\` / \`${parsed.authResults.dkim}\` / \`${parsed.authResults.dmarc}\``,
  );
  lines.push(`- Links: ${parsed.linkCount} · Attachments: ${parsed.attachmentCount}`);
  lines.push("");

  if (analysis.redFlags.length > 0) {
    lines.push(`## Red flags (${analysis.redFlags.length})`);
    analysis.redFlags.forEach((f, i) => {
      lines.push("");
      lines.push(`### ${i + 1}. ${f.title}  \`${f.severity}\``);
      lines.push(f.explanation);
      if (f.evidence) {
        lines.push("");
        lines.push("```");
        lines.push(f.evidence);
        lines.push("```");
      }
    });
    lines.push("");
  }

  if (analysis.legitimateSignals.length > 0) {
    lines.push(`## Signals of legitimacy`);
    analysis.legitimateSignals.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
  }

  if (analysis.recommendedActions.length > 0) {
    lines.push(`## Recommended actions`);
    analysis.recommendedActions.forEach((a, i) =>
      lines.push(`${i + 1}. ${a}`),
    );
    lines.push("");
  }

  lines.push(`## Takeaway`);
  lines.push(analysis.educationalTakeaway);
  lines.push("");
  lines.push("---");
  lines.push(
    `_Analyzed by Sentra AI · model ${meta.model} · ${meta.latencyMs} ms_`,
  );
  return lines.join("\n");
}
