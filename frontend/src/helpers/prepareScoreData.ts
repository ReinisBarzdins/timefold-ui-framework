import type { ScoreExplanationType } from "../types/ScoreExplanationType.ts";

export type ScoreExplanationFrontendType = {
  hard: number | null;
  medium: number | null;
  soft: number | null;
  explanation: string | null;
};

const parseImpact = (impact: string): Omit<ScoreExplanationFrontendType, "explanation"> => {
  const hardMatch = impact.match(/(-?\d+)hard/i);
  const mediumMatch = impact.match(/(-?\d+)medium/i);
  const softMatch = impact.match(/(-?\d+)soft/i);

  return {
    hard: hardMatch ? Number(hardMatch[1]) : null,
    medium: mediumMatch ? Number(mediumMatch[1]) : null,
    soft: softMatch ? Number(softMatch[1]) : null,
  };
};


export const prepareScoreData = (
  score: ScoreExplanationType | undefined
): Map<string, ScoreExplanationFrontendType[]> => {
  const lookup = new Map<string, ScoreExplanationFrontendType[]>();

  if (!score) {
    return lookup;
  }

  for (const constraint of score.constraints ?? []) {
    for (const match of constraint.sampleMatches ?? []) {
      const parsedImpact = parseImpact(match.impact);

      const scoreNoViolation = parsedImpact.hard === 0 && parsedImpact.medium === 0 && parsedImpact.soft === 0;
      const scoreExplanation: ScoreExplanationFrontendType = {
        ...parsedImpact,
        explanation: scoreNoViolation ? null : constraint.name,
      };

      for (const objectLabel of match.objects ?? []) {
        const existing = lookup.get(objectLabel) ?? [];

        lookup.set(objectLabel, [...existing, scoreExplanation]);
      }
    }
  }

  return lookup;
};