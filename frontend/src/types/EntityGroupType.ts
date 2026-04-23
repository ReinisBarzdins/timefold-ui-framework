import type { EntityInstanceType } from "./EntityInstanceType.ts";

export type EntityGroupType = {
  entityClass: string;
  entities: EntityInstanceType[];
}