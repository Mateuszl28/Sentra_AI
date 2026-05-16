import type { HeuristicFinding, HeuristicReport } from "@/lib/types";
import { parseEmail } from "./parseEmail";
import { analyzeHeaders } from "./headers";
import { analyzeSender } from "./sender";
import { analyzeLinks } from "./links";
import { analyzeContent } from "./content";

const SEVERITY_WEIGHT: Record<HeuristicFinding["severity"], number> = {
  info: 0,
  low: 8,
  medium: 18,
  high: 32,
};

export async function runHeuristics(raw: string): Promise<HeuristicReport> {
  const parsed = await parseEmail(raw);
  const findings = [
    ...analyzeHeaders(parsed),
    ...analyzeSender(parsed),
    ...analyzeLinks(parsed),
    ...analyzeContent(parsed),
  ];

  let score = 0;
  for (const f of findings) score += SEVERITY_WEIGHT[f.severity];
  score = Math.min(100, score);

  return { parsed, findings, heuristicScore: score };
}
