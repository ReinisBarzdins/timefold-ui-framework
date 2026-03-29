import type { EntityGroupType } from "./EntityGroupType.ts";

export type SolutionStructureType = {
  solutionClass: string;
  entityGroups: EntityGroupType[];
  problemFactGroups: EntityGroupType[];
}