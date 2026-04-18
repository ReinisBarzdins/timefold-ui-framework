import type { EntityGroupType } from "./EntityGroupType.ts";

export type SolutionStructureType = {
  solutionClass: string;
  solverStatus: string;
  entityGroups: EntityGroupType[];
  problemFactGroups: EntityGroupType[];
}