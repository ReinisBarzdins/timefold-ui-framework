import type { ConstraintType } from "./ConstraintType.ts";
import type { IndictmentType } from "./IndictmentType.ts";

export type ScoreExplanationType = {
  score: string;
  constraints: ConstraintType[];
  indictments: IndictmentType[];
}