import type { MatchType } from "./MatchType.ts";

export type ConstraintType = {
  name: string;
  impactTotal: string;
  matchCount: number;
  sampleMatches: MatchType[];
}