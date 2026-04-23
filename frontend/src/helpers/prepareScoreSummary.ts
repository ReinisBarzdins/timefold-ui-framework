import type { ScoreExplanationType } from "../types/ScoreExplanationType.ts";

export type ParsedScoreType = {
  hard: number;
  medium: number;
  soft: number;
};

export const parseScoreString = (score: string): ParsedScoreType => {
  const hardMatch = score.match(/(-?\d+)hard/i);
  const mediumMatch = score.match(/(-?\d+)medium/i);
  const softMatch = score.match(/(-?\d+)soft/i);

  return {
    hard: hardMatch ? Number(hardMatch[1]) : 0,
    medium: mediumMatch ? Number(mediumMatch[1]) : 0,
    soft: softMatch ? Number(softMatch[1]) : 0,
  };
};

export const prepareScoreSummary = (scoreData?: ScoreExplanationType | null) => {
  if (!scoreData) {
    return {
      totalScore: null,
      activeConstraints: [],
    };
  }

  const activeConstraints = (scoreData.constraints ?? []).filter((constraint) => {
    const parsed = parseScoreString(constraint.impactTotal);

    return parsed.hard !== 0 || parsed.medium !== 0 || parsed.soft !== 0;
  });

  return {
    totalScore: parseScoreString(scoreData.score),
    activeConstraints,
  };
};