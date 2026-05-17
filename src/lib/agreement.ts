import type { AgreementSummary, LlmAnalysis } from "@/lib/types";

function band(score: number): "safe" | "suspicious" | "phishing" {
  if (score <= 25) return "safe";
  if (score <= 65) return "suspicious";
  return "phishing";
}

export function computeAgreement(
  heuristicScore: number,
  llm: LlmAnalysis,
): AgreementSummary {
  const llmScore = llm.riskScore;
  const delta = Math.abs(heuristicScore - llmScore);
  const hBand = band(heuristicScore);
  const lBand = band(llmScore);

  if (hBand === lBand && delta <= 20) {
    return {
      band: "aligned",
      heuristicScore,
      llmScore,
      delta,
      label: "High confidence",
      explanation:
        "Heuristic checks and Gemini's reading land in the same band — both layers point to the same verdict, so the call is robust.",
    };
  }

  if (hBand === lBand) {
    return {
      band: "aligned",
      heuristicScore,
      llmScore,
      delta,
      label: "Aligned · same band",
      explanation:
        "Both layers agree on the verdict band but disagree on intensity. Treat the verdict as the right call; risk score sits somewhere between the two.",
    };
  }

  // Adjacent bands (safe↔suspicious or suspicious↔phishing) — split
  const adjacent =
    (hBand === "safe" && lBand === "suspicious") ||
    (hBand === "suspicious" && lBand === "safe") ||
    (hBand === "suspicious" && lBand === "phishing") ||
    (hBand === "phishing" && lBand === "suspicious");

  if (adjacent) {
    return {
      band: "split",
      heuristicScore,
      llmScore,
      delta,
      label: "Split decision",
      explanation: `Heuristics scored ${heuristicScore} (${hBand}); Gemini scored ${llmScore} (${lBand}). One layer is reading context the other can't. Lean toward caution and check the red flags below.`,
    };
  }

  // safe↔phishing — strong conflict
  return {
    band: "conflict",
    heuristicScore,
    llmScore,
    delta,
    label: "Layers conflict",
    explanation: `Strong disagreement: heuristics say ${hBand}, Gemini says ${lBand}. This is rare and usually means one layer is blind to a critical signal — read the heuristic findings and the LLM's reasoning side-by-side before trusting the verdict.`,
  };
}
